// 페이지 배경: 해도 격자(48px) + 상단 방사형 광원 + 미세 노이즈. 스크롤과 무관하게 고정.
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__glow" />
      <div className="backdrop__grid" />
      <div className="backdrop__noise" />
    </div>
  );
}
