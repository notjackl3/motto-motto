export default function Wave() {
  // TODO: animated displaced plane driven by tide data
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[40, 40, 1, 1]} />
      <meshStandardMaterial color="#2a6f97" />
    </mesh>
  );
}
