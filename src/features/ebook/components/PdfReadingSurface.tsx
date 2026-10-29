"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import styles from "./reader.module.css";

export type ReaderScale = "page-width" | "page-fit" | number;
export type PdfSearchRequest = {
  query: string;
  previous: boolean;
  again: boolean;
  serial: number;
};
type Props = {
  document: PDFDocumentProxy;
  page: number;
  scale: ReaderScale;
  singlePage: boolean;
  search: PdfSearchRequest | null;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onMatchesChange: (matches: { current: number; total: number }) => void;
  onSearchPending: (pending: boolean) => void;
  onError: (message: string) => void;
};

export function PdfReadingSurface(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const engine = useRef<{
    goTo: (page: number) => void;
    scale: (scale: ReaderScale) => void;
    layout: (single: boolean) => void;
    search: (request: PdfSearchRequest) => void;
  } | null>(null);
  const current = useRef(props);
  useEffect(() => {
    current.current = props;
  });

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let frame = 0;
    let cleanup = () => {};
    async function initialize() {
      const {
        EventBus,
        PDFViewer,
        PDFLinkService,
        PDFFindController,
        ScrollMode,
      } = await import("pdfjs-dist/web/pdf_viewer.mjs");
      if (cancelled || !containerRef.current || !pagesRef.current) return;
      const bus = new EventBus();
      const links = new PDFLinkService({
        eventBus: bus,
        externalLinkTarget: 2,
        externalLinkRel: "noopener noreferrer nofollow",
        ignoreDestinationZoom: true,
      });
      const find = new PDFFindController({ eventBus: bus, linkService: links });
      const viewer = new PDFViewer({
        container: containerRef.current,
        viewer: pagesRef.current,
        eventBus: bus,
        linkService: links,
        findController: find,
        removePageBorders: true,
        annotationMode: 1,
        textLayerMode: 1,
        maxCanvasPixels: 16_777_216,
        maxCanvasDim: 8192,
        enableAutoLinking: false,
      });
      engine.current = {
        goTo: (page) => {
          if (viewer.pagesCount && viewer.currentPageNumber !== page)
            viewer.currentPageNumber = page;
        },
        scale: (scale) => {
          if (viewer.pagesCount) viewer.currentScaleValue = String(scale);
        },
        layout: (single) => {
          if (viewer.pagesCount) {
            viewer.scrollMode = single ? ScrollMode.PAGE : ScrollMode.VERTICAL;
            viewer.currentPageNumber = current.current.page;
          }
        },
        search: (request) =>
          bus.dispatch("find", {
            source: viewer,
            type: request.again ? "again" : "",
            query: request.query,
            caseSensitive: false,
            entireWord: false,
            highlightAll: true,
            findPrevious: request.previous,
            matchDiacritics: false,
          }),
      };
      links.setViewer(viewer);
      links.setDocument(props.document);
      const ready = () => {
        viewer.scrollMode = current.current.singlePage
          ? ScrollMode.PAGE
          : ScrollMode.VERTICAL;
        viewer.currentScaleValue = String(current.current.scale);
        viewer.currentPageNumber = current.current.page;
      };
      const pageChanged = ({ pageNumber }: { pageNumber: number }) =>
        current.current.onPageChange(pageNumber);
      const scaleChanged = ({ scale }: { scale: number }) =>
        current.current.onScaleChange(scale);
      const matchesChanged = ({
        matchesCount,
      }: {
        matchesCount: { current: number; total: number };
      }) => current.current.onMatchesChange(matchesCount);
      const findStateChanged = ({ state }: { state: number }) =>
        current.current.onSearchPending(state === 3);
      const renderError = ({ error }: { error?: Error }) => {
        if (error)
          current.current.onError(
            "This PDF page could not be rendered. Please reopen the reader.",
          );
      };
      bus.on("pagesinit", ready);
      bus.on("pagechanging", pageChanged);
      bus.on("scalechanging", scaleChanged);
      bus.on("updatefindmatchescount", matchesChanged);
      bus.on("updatefindcontrolstate", findStateChanged);
      bus.on("pagerendered", renderError);
      viewer.setDocument(props.document);
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (
            cancelled ||
            !viewer.pagesCount ||
            !containerRef.current?.clientWidth
          )
            return;
          const page = viewer.currentPageNumber;
          if (typeof current.current.scale === "string")
            viewer.currentScaleValue = current.current.scale;
          viewer.currentPageNumber = page;
          viewer.update();
        });
      });
      observer.observe(containerRef.current);
      cleanup = () => {
        bus.off("pagesinit", ready);
        bus.off("pagechanging", pageChanged);
        bus.off("scalechanging", scaleChanged);
        bus.off("updatefindmatchescount", matchesChanged);
        bus.off("updatefindcontrolstate", findStateChanged);
        bus.off("pagerendered", renderError);
        viewer.setDocument(null);
        links.setDocument(null);
      };
    }
    void initialize().catch(() => {
      if (!cancelled)
        current.current.onError(
          "The PDF viewer could not start. Please reopen the reader.",
        );
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      cleanup();
      engine.current = null;
    };
  }, [props.document]);

  useEffect(() => {
    engine.current?.goTo(props.page);
  }, [props.page]);
  useEffect(() => {
    engine.current?.scale(props.scale);
  }, [props.scale]);
  useEffect(() => {
    engine.current?.layout(props.singlePage);
  }, [props.singlePage]);
  useEffect(() => {
    if (!props.search || !engine.current) return;
    engine.current.search(props.search);
  }, [props.search]);

  return (
    <div
      ref={containerRef}
      className={styles.pdfViewport}
      tabIndex={0}
      aria-label="PDF reading surface"
    >
      <div ref={pagesRef} className="pdfViewer removePageBorders" />
    </div>
  );
}
