# Admin And Staff Authors Override

Applies to `/staff/authors` and author registry management surfaces.

## Layout

- Use a single rounded workspace panel with the page heading, actions, form, search, summary cards, and author table inside one surface.
- Desktop layout should place the create/edit author form in a fixed left column and the search/table workflow in a flexible right column.
- Mobile and tablet layouts stack the form above the table, preserving the search and summary cards before the table.

## Visual Emphasis

- Portrait upload is the primary task in the form panel and should use a dashed dropzone-style area with a clear file type and size note.
- Author table rows should stay compact: avatar, author name, portrait status, bio editor, and actions.
- Use navy for table headers and red/burgundy only for primary actions and active pagination.

## Component Behavior

- Image upload remains part of create/edit author save flow and must keep existing multipart API behavior.
- Inline table save should update editable row metadata without exposing portrait upload controls in every row.
- The page should include loading, empty, error, and success states without shifting the table layout.
