// The whole app is rendered by app/_layout.tsx (src/App.tsx manages its own screens).
// This route only exists so "/" matches; without it expo-router shows "Unmatched Route".
export default function Index() {
  return null;
}
