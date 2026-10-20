// TODO (team): replace with real health videos.
// Put short vertical clips in Cloudinary (or any public MP4 URL) and paste the link into `url`.
// Later this list can move into MongoDB with a /api/videos route.
export const VIDEOS = [
  { id: 1, tag: 'Exercise', title: 'Five-minute chair exercises for stiff knees', by: 'Nurse Lina', url: 'https://res.cloudinary.com/ols6jymh/video/upload/v1792482053/Chair_Exercise.mp4' },
  { id: 2, tag: 'Diet', title: 'Breakfast ideas that keep your sugar steady', by: 'Dietitian Amir', url: 'https://res.cloudinary.com/ols6jymh/video/upload/v1792483010/Breakfast_Sugar_Level_Steady.mp4' },
  { id: 3, tag: 'Heart', title: 'How to check your blood pressure at home', by: 'Klinik Sihat', url: 'https://res.cloudinary.com/ols6jymh/video/upload/v1792483095/Blood_Pressure.mp4' },
  { id: 4, tag: 'Medication', title: 'Before food or after food? Your pills explained', by: 'Pharmacist Wong', url: 'https://res.cloudinary.com/ols6jymh/video/upload/v1792483301/Taking_meds_with_food_vs_on_an_empty_stomach-_what_s_the_verdict_The_verdict_is_listen_to_your_pharmacist..mp4' }
];
