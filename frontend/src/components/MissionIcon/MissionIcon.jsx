const paths = {
  plus: "M12 4v16M4 12h16",
  microphone: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM6 10v2a6 6 0 0 0 12 0v-2M12 18v4M9 22h6",
  sender: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  details: "M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6",
  actions: "M4 6h12m-4-4 4 4-4 4M20 18H8m4-4-4 4 4 4",
  report: "m12 3 10 18H2ZM12 9v5M12 17v1",
  block: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM6 6l12 12",
  delete: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7",
  continue: "M4 12h16m-6-6 6 6-6 6",
  link: "m10 13 4-4M8 15l-2 2a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m4 0 2-2a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0",
  close: "m6 6 12 12M18 6 6 18",
  wifi: "M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 16a5 5 0 0 1 6 0M12 20h.01"
};
export default function MissionIcon({ name, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name] || paths.details} /></svg>;
}
