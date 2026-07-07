export function fmtWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export function fmtNum(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function fmtGongsu(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}
