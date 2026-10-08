export type NoticeLocale = "en" | "vi";
export type NoticeRole = "guest" | "member" | "staff" | "admin";
export type NoticeCategory = "action" | "borrowing" | "announcement" | "account";

export type LocalizedText = Record<NoticeLocale, string>;

export type NoticeTemplate = {
  id: string;
  category: NoticeCategory;
  title: LocalizedText;
  body: LocalizedText;
  meta: LocalizedText;
  time: LocalizedText;
  href: string;
  actionLabel: LocalizedText;
  read?: boolean;
};

export type QuickAction = {
  id: "borrows" | "holds" | "fines" | "profile" | "circulation" | "pickup" | "members" | "imports" | "dashboard" | "payments" | "books" | "register" | "guide";
  title: LocalizedText;
  description: LocalizedText;
  href: string;
};

const text = (en: string, vi: string): LocalizedText => ({ en, vi });

export const noticePageText = {
  eyebrow: text("Member notice center", "Trung tâm thông báo thành viên"),
  staffEyebrow: text("Staff notice center", "Trung tâm thông báo nhân viên"),
  adminEyebrow: text("Admin notice center", "Trung tâm thông báo quản trị"),
  guestEyebrow: text("Library notice center", "Trung tâm thông báo thư viện"),
  title: text("Library Notice Center", "Trung tâm thông báo thư viện"),
  description: text("Updates selected for your library account.", "Các cập nhật được chọn riêng cho tài khoản thư viện của bạn."),
  guestDescription: text("Public service updates, collection news, and events from The Athenaeum.", "Cập nhật dịch vụ công khai, tin bộ sưu tập và sự kiện từ The Athenaeum."),
  unread: text("unread", "chưa đọc"),
  thisMonth: text("this month", "trong tháng này"),
  searchPlaceholder: text("Search notices...", "Tìm thông báo..."),
  unreadOnly: text("Unread only", "Chỉ chưa đọc"),
  filters: {
    all: text("All", "Tất cả"),
    action: text("Action required", "Cần xử lý"),
    borrowing: text("Borrowing", "Mượn sách"),
    announcement: text("Announcements", "Thông báo chung"),
    account: text("Account", "Tài khoản"),
  },
  categories: {
    action: text("Action required", "Cần xử lý"),
    borrowing: text("Borrowing", "Mượn sách"),
    announcement: text("Library announcement", "Thông báo thư viện"),
    account: text("Account", "Tài khoản"),
  },
  markRead: text("Mark as read", "Đánh dấu đã đọc"),
  markAllRead: text("Mark all as read", "Đánh dấu tất cả đã đọc"),
  noResults: text("No notices match your search.", "Không có thông báo phù hợp với tìm kiếm."),
  noResultsBody: text("Try another keyword or choose a different category.", "Hãy thử từ khóa khác hoặc chọn một danh mục khác."),
  quickActions: text("Quick actions", "Thao tác nhanh"),
  deliveryPreferences: text("Delivery preferences", "Tùy chọn nhận thông báo"),
  deliveryDescription: text("Choose how you would like to receive library notifications.", "Chọn cách bạn muốn nhận thông báo từ thư viện."),
  webNotifications: text("Web notifications", "Thông báo trên web"),
  webNotificationsBody: text("Show updates in your library account", "Hiển thị cập nhật trong tài khoản thư viện"),
  emailNotifications: text("Email notifications", "Thông báo qua email"),
  emailNotificationsBody: text("Send important account updates by email", "Gửi cập nhật quan trọng của tài khoản qua email"),
  signInTitle: text("Personal notices are ready when you sign in", "Thông báo cá nhân sẽ xuất hiện sau khi bạn đăng nhập"),
  signInBody: text("Sign in to track loans, holds, fines, and membership updates.", "Đăng nhập để theo dõi lượt mượn, đặt giữ, phí phạt và trạng thái thành viên."),
  signIn: text("Sign in", "Đăng nhập"),
  thisWeek: text("This week", "Tuần này"),
  newNotices: text("New notices", "Thông báo mới"),
  actionsRequired: text("Action required", "Cần xử lý"),
  announcementsLabel: text("Announcements", "Thông báo chung"),
  accountUpdates: text("Account updates", "Cập nhật tài khoản"),
  announcementsEyebrow: text("From the library desk", "Từ quầy thư viện"),
  announcementsTitle: text("Library announcements", "Thông báo từ thư viện"),
  viewAll: text("View all announcements", "Xem tất cả thông báo"),
  neverMiss: text("Never miss an important update", "Không bỏ lỡ cập nhật quan trọng"),
  neverMissBody: text("Choose how you receive notifications about loans, holds, new arrivals, and library news.", "Chọn cách nhận thông báo về lượt mượn, đặt giữ, sách mới và tin tức thư viện."),
  managePreferences: text("Manage preferences", "Quản lý tùy chọn"),
};

export const roleNotices: Record<NoticeRole, NoticeTemplate[]> = {
  guest: [
    {
      id: "guest-study-hours",
      category: "announcement",
      title: text("Extended study hours", "Mở rộng giờ học"),
      body: text("The main reading room stays open until 10:00 PM during assessment week.", "Phòng đọc chính mở đến 22:00 trong tuần đánh giá."),
      meta: text("Library service", "Dịch vụ thư viện"),
      time: text("1 day ago", "1 ngày trước"),
      href: "/borrowing-guide",
      actionLabel: text("View details", "Xem chi tiết"),
    },
    {
      id: "guest-digital-collection",
      category: "announcement",
      title: text("New digital systems collection", "Bộ sưu tập hệ thống số mới"),
      body: text("Explore recent titles in databases, distributed systems, and information retrieval.", "Khám phá đầu sách mới về cơ sở dữ liệu, hệ thống phân tán và truy xuất thông tin."),
      meta: text("Digital collection", "Bộ sưu tập số"),
      time: text("3 days ago", "3 ngày trước"),
      href: "/books",
      actionLabel: text("Browse books", "Duyệt sách"),
      read: true,
    },
  ],
  member: [
    {
      id: "member-hold-ready",
      category: "action",
      title: text("Book ready for pickup", "Sách đã sẵn sàng để nhận"),
      body: text("Your reserved book is ready for pickup at the circulation desk.", "Sách bạn đặt giữ đã sẵn sàng để nhận tại quầy lưu thông."),
      meta: text("The Midnight Library · Pickup by Oct 10", "The Midnight Library · Nhận trước 10/10"),
      time: text("2 hours ago", "2 giờ trước"),
      href: "/user/holds",
      actionLabel: text("View hold", "Xem đặt giữ"),
    },
    {
      id: "member-loan-due",
      category: "borrowing",
      title: text("Loan due tomorrow", "Sách đến hạn vào ngày mai"),
      body: text("Renew now if the book is eligible, or return it before the due date.", "Gia hạn ngay nếu sách đủ điều kiện hoặc trả sách trước ngày đến hạn."),
      meta: text("Clean Code · Due Oct 9", "Clean Code · Hạn trả 09/10"),
      time: text("18 hours ago", "18 giờ trước"),
      href: "/user/loans",
      actionLabel: text("Renew now", "Gia hạn ngay"),
    },
    {
      id: "member-study-hours",
      category: "announcement",
      title: text("Extended study hours", "Mở rộng giờ học"),
      body: text("The main reading room stays open until 10:00 PM during assessment week.", "Phòng đọc chính mở đến 22:00 trong tuần đánh giá."),
      meta: text("Library announcement", "Thông báo thư viện"),
      time: text("1 day ago", "1 ngày trước"),
      href: "/borrowing-guide",
      actionLabel: text("View details", "Xem chi tiết"),
    },
    {
      id: "member-expiry",
      category: "account",
      title: text("Membership expires in 14 days", "Thẻ thành viên hết hạn sau 14 ngày"),
      body: text("Review your membership information to continue using library services.", "Kiểm tra thông tin thành viên để tiếp tục sử dụng dịch vụ thư viện."),
      meta: text("Account update", "Cập nhật tài khoản"),
      time: text("2 days ago", "2 ngày trước"),
      href: "/profile",
      actionLabel: text("Review membership", "Xem thành viên"),
      read: true,
    },
  ],
  staff: [
    {
      id: "staff-pickup-queue",
      category: "action",
      title: text("8 holds are ready for pickup", "8 lượt đặt giữ sẵn sàng để nhận"),
      body: text("Prepare assigned copies and complete pickup checkout when members arrive.", "Chuẩn bị các bản sao được phân công và hoàn tất nhận sách khi thành viên đến."),
      meta: text("Circulation desk", "Quầy lưu thông"),
      time: text("12 minutes ago", "12 phút trước"),
      href: "/staff/holds/pickup",
      actionLabel: text("Open pickup queue", "Mở hàng đợi nhận sách"),
    },
    {
      id: "staff-overdue",
      category: "action",
      title: text("5 overdue loans need follow-up", "5 lượt mượn quá hạn cần xử lý"),
      body: text("Review borrower records and contact members before fines continue accumulating.", "Xem hồ sơ người mượn và liên hệ thành viên trước khi phí phạt tiếp tục tăng."),
      meta: text("Loan monitor", "Theo dõi mượn sách"),
      time: text("1 hour ago", "1 giờ trước"),
      href: "/staff/loans",
      actionLabel: text("Review loans", "Xem lượt mượn"),
    },
    {
      id: "staff-import",
      category: "account",
      title: text("Catalog import completed", "Nhập danh mục đã hoàn tất"),
      body: text("The latest import finished successfully and the new records are available for review.", "Lần nhập gần nhất đã hoàn tất và các bản ghi mới đã sẵn sàng để kiểm tra."),
      meta: text("Import job", "Tác vụ nhập dữ liệu"),
      time: text("3 hours ago", "3 giờ trước"),
      href: "/staff/imports",
      actionLabel: text("View import", "Xem tác vụ"),
    },
    {
      id: "staff-study-hours",
      category: "announcement",
      title: text("Extended study hours", "Mở rộng giờ học"),
      body: text("The main reading room stays open until 10:00 PM during assessment week.", "Phòng đọc chính mở đến 22:00 trong tuần đánh giá."),
      meta: text("Staff announcement", "Thông báo nhân viên"),
      time: text("1 day ago", "1 ngày trước"),
      href: "/notices",
      actionLabel: text("View details", "Xem chi tiết"),
      read: true,
    },
  ],
  admin: [
    {
      id: "admin-delivery-failures",
      category: "action",
      title: text("3 notification deliveries need attention", "3 lượt gửi thông báo cần xử lý"),
      body: text("Review failed deliveries and retry eligible messages from the operations dashboard.", "Kiểm tra các lượt gửi thất bại và gửi lại những thông báo đủ điều kiện."),
      meta: text("Notification delivery", "Gửi thông báo"),
      time: text("8 minutes ago", "8 phút trước"),
      href: "/admin/dashboard",
      actionLabel: text("Review delivery", "Kiểm tra gửi thông báo"),
    },
    {
      id: "admin-members",
      category: "account",
      title: text("Membership review queue updated", "Hàng đợi kiểm tra thành viên đã cập nhật"),
      body: text("New expiring and suspended member records are ready for administrative review.", "Các hồ sơ sắp hết hạn và bị tạm khóa đã sẵn sàng để quản trị viên kiểm tra."),
      meta: text("Member administration", "Quản lý thành viên"),
      time: text("45 minutes ago", "45 phút trước"),
      href: "/staff/members",
      actionLabel: text("Review members", "Xem thành viên"),
    },
    {
      id: "admin-system",
      category: "announcement",
      title: text("Weekend maintenance scheduled", "Đã lên lịch bảo trì cuối tuần"),
      body: text("Member services may be briefly unavailable during the scheduled maintenance window.", "Dịch vụ thành viên có thể tạm gián đoạn trong thời gian bảo trì."),
      meta: text("System update", "Cập nhật hệ thống"),
      time: text("3 hours ago", "3 giờ trước"),
      href: "/admin/dashboard",
      actionLabel: text("View dashboard", "Xem bảng điều khiển"),
    },
    {
      id: "admin-catalog",
      category: "account",
      title: text("Catalog import completed", "Nhập danh mục đã hoàn tất"),
      body: text("The latest import finished successfully and the new records are available for review.", "Lần nhập gần nhất đã hoàn tất và các bản ghi mới đã sẵn sàng để kiểm tra."),
      meta: text("Catalog operations", "Vận hành danh mục"),
      time: text("1 day ago", "1 ngày trước"),
      href: "/staff/imports",
      actionLabel: text("View import", "Xem tác vụ"),
      read: true,
    },
  ],
};

export const quickActions: Record<NoticeRole, QuickAction[]> = {
  guest: [
    { id: "books", title: text("Browse books", "Duyệt sách"), description: text("Explore the public catalog", "Khám phá danh mục công khai"), href: "/books" },
    { id: "guide", title: text("Borrowing guide", "Hướng dẫn mượn"), description: text("Learn library policies", "Tìm hiểu chính sách thư viện"), href: "/borrowing-guide" },
    { id: "register", title: text("Become a member", "Trở thành thành viên"), description: text("Create your library account", "Tạo tài khoản thư viện"), href: "/register" },
  ],
  member: [
    { id: "borrows", title: text("My borrows", "Sách đang mượn"), description: text("View and renew your loans", "Xem và gia hạn lượt mượn"), href: "/user/loans" },
    { id: "holds", title: text("My holds", "Lượt đặt giữ"), description: text("Check your reservations", "Kiểm tra sách đặt giữ"), href: "/user/holds" },
    { id: "fines", title: text("Pay fines", "Thanh toán phí phạt"), description: text("View outstanding fees", "Xem các khoản phí chưa thanh toán"), href: "/user/fines" },
    { id: "profile", title: text("Account preferences", "Tùy chọn tài khoản"), description: text("Manage your profile", "Quản lý hồ sơ của bạn"), href: "/profile" },
  ],
  staff: [
    { id: "circulation", title: text("Circulation desk", "Quầy lưu thông"), description: text("Manage checkout and returns", "Quản lý mượn và trả sách"), href: "/staff/circulation" },
    { id: "pickup", title: text("Hold pickup", "Nhận sách đặt giữ"), description: text("Process ready reservations", "Xử lý đặt giữ sẵn sàng"), href: "/staff/holds/pickup" },
    { id: "members", title: text("Members", "Thành viên"), description: text("Review borrower accounts", "Kiểm tra tài khoản người mượn"), href: "/staff/members" },
    { id: "imports", title: text("Import jobs", "Tác vụ nhập"), description: text("Track catalog imports", "Theo dõi nhập danh mục"), href: "/staff/imports" },
  ],
  admin: [
    { id: "dashboard", title: text("Admin dashboard", "Bảng điều khiển"), description: text("View operational health", "Xem tình trạng vận hành"), href: "/admin/dashboard" },
    { id: "payments", title: text("Payments", "Thanh toán"), description: text("Review payments and receipts", "Kiểm tra thanh toán và biên nhận"), href: "/admin/payments" },
    { id: "members", title: text("Member administration", "Quản lý thành viên"), description: text("Manage member status", "Quản lý trạng thái thành viên"), href: "/staff/members" },
    { id: "books", title: text("Catalog administration", "Quản lý danh mục"), description: text("Manage books and copies", "Quản lý sách và bản sao"), href: "/admin/books" },
  ],
};

export const libraryAnnouncements = [
  {
    id: "digital-systems",
    category: text("Digital collections", "Bộ sưu tập số"),
    date: text("Oct 7, 2026", "07/10/2026"),
    title: text("New digital systems collection", "Bộ sưu tập hệ thống số mới"),
    body: text("Explore our expanded collection of computer science, data science, and digital humanities resources.", "Khám phá bộ sưu tập mở rộng về khoa học máy tính, khoa học dữ liệu và nhân văn số."),
    href: "/books",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "quiet-zone",
    category: text("Library space", "Không gian thư viện"),
    date: text("Oct 5, 2026", "05/10/2026"),
    title: text("Quiet zone refresh", "Làm mới khu vực yên tĩnh"),
    body: text("Level 2 now offers improved seating, lighting, and power access for focused study.", "Tầng 2 đã cải thiện chỗ ngồi, ánh sáng và nguồn điện cho việc học tập tập trung."),
    href: "/about",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "maintenance",
    category: text("System update", "Cập nhật hệ thống"),
    date: text("Oct 3, 2026", "03/10/2026"),
    title: text("Weekend maintenance", "Bảo trì cuối tuần"),
    body: text("The online catalog and member services will be briefly unavailable during scheduled maintenance.", "Danh mục trực tuyến và dịch vụ thành viên sẽ tạm gián đoạn trong thời gian bảo trì."),
    href: "/notices",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80",
  },
];
