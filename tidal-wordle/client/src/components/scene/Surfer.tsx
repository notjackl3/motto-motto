export default function Surfer() {
  // TODO: replace cube with surfer model + idle/ride animations
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f4e1c1" />
    </mesh>
  );
}
