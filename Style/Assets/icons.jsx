export const WorkManagementAppIcon = ({ width = 20, height = 20 }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 42 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.8506 11.915C23.4961 11.915 25.9705 12.6471 28.083 13.9189C28.0834 13.9601 28.085 14.0017 28.085 14.043C28.0848 19.3277 25.1646 23.9299 20.8506 26.3262C22.8674 27.4464 25.1886 28.085 27.6592 28.085C30.3049 28.0849 32.779 27.3521 34.8916 26.0801C34.8257 33.7791 28.5652 40 20.8506 40C13.136 40 6.87445 33.7791 6.80859 26.0801C8.92138 27.3524 11.396 28.0849 14.042 28.085C16.5126 28.085 18.8338 27.4464 20.8506 26.3262C16.5365 23.9299 13.6164 19.3277 13.6162 14.043C13.6162 14.0017 13.6168 13.9601 13.6172 13.9189C15.7299 12.6468 18.2047 11.915 20.8506 11.915ZM14.042 0C16.5125 0 18.8338 0.638573 20.8506 1.75879C16.57 4.13643 13.6623 8.6859 13.6172 13.9189C9.53728 16.3757 6.80777 20.8476 6.80762 25.957C6.80762 25.9979 6.80824 26.0392 6.80859 26.0801C2.72895 23.6233 0.000148056 19.1522 0 14.043C0 6.28751 6.28654 4.47946e-05 14.042 0ZM27.6592 0C35.4146 4.484e-05 41.7012 6.28751 41.7012 14.043C41.701 19.1525 38.9716 23.6234 34.8916 26.0801C34.892 26.0392 34.8936 25.998 34.8936 25.957C34.8934 20.8473 32.1633 16.3756 28.083 13.9189C28.0379 8.6859 25.1311 4.13643 20.8506 1.75879C22.8673 0.638573 25.1886 0 27.6592 0Z"
        fill="url(#paint0_radial_4266_105639)"
      />
      <defs>
        <radialGradient
          id="paint0_radial_4266_105639"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(21.2761 18.7234) rotate(91.1457) scale(21.2809 22.1859)"
        >
          <stop offset="0.366428" stopColor="#3B9DA3" />
          <stop offset="1" stopColor="#036A70" />
        </radialGradient>
      </defs>
    </svg>
  );


  // Close Icon SVG
export const CloseIcon = ({
  height = 24,
  width = 24,
  fill = "#fff",
  stroke = "#FF0202",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="12" fill={fill} />
    <path
      d="M16.9498 7.05024L7.05027 16.9497"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={2}
    />
    <path
      d="M7.05023 7.05024L16.9497 16.9497"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={2}
    />
  </svg>
);

// components/Icons.js
export const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

export const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export const KanbanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="6" height="6"/><rect x="14" y="3" width="6" height="6"/><rect x="3" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>
  </svg>
);



// SVG Icons to replace React Icons
export const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);


export const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

export const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);


export const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);


export const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
  </svg>
);

export const TagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 7l10.5 10.5a2 2 0 002.828 0l2.121-2.121a2 2 0 000-2.828L12 4l-5 5z" />
  </svg>
);

export const PaperclipIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.44 11.05L12.414 20.08a4 4 0 01-5.657-5.657l9.025-9.025a2 2 0 112.828 2.828L10.586 17.414a1 1 0 001.414 1.414l8.486-8.486a4 4 0 10-5.657-5.657l-8.486 8.486" />
  </svg>
);

export const MoreVerticalIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z" />
  </svg>
);

export const ArchiveIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0H4m16 0l-1.293 1.293a1 1 0 01-1.414 0L12 13m-6 0l1.293 1.293a1 1 0 001.414 0L12 13m0 0V7" />
  </svg>
);


export const FilterIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6 6V20a1 1 0 01-2 0v-7.293l-6-6A1 1 0 013 6V4z" />
  </svg>
);

export const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
  </svg>
);


export const CheckCircleIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke={stroke}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// CustomIcons.jsx

export const EditIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4h2m7 7v2m-9 7H9m-7-9H2m2-4l7 7-4 4-7-7 4-4zM21 3a2.828 2.828 0 010 4L10 18H6v-4L17 3a2.828 2.828 0 014 0z" />
  </svg>
);

export const TrashIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L18.132 19.142A2 2 0 0116.137 21H7.863a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m5-4v4" />
  </svg>
);
export const CheckIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const MessageSquareIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
  </svg>
);

export const Link2Icon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l1.42-1.42a5 5 0 00-7.07-7.07l-.7.7M14 11a5 5 0 00-7.54-.54l-1.42 1.42a5 5 0 007.07 7.07l.7-.7" />
  </svg>
);

export const ListIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const InfoIcon = ({ className = "w-5 h-5", stroke = "currentColor" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);
