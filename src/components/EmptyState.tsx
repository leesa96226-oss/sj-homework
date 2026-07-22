interface Props {
  onUploadClick: () => void;
  onDemo: () => void;
}

export function EmptyState({ onUploadClick, onDemo }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-card">
        <div className="empty-icon">📊</div>
        <h2>인력공수 데이터 불러오기</h2>
        <p>
          공수 엑셀 파일(<code>웹_데이터</code> 시트 포함)을 업로드하면
          <br />
          대시보드가 바로 만들어집니다.
        </p>
        <button className="upload-btn big" onClick={onUploadClick}>
          ⬆ 엑셀 파일 선택 (.xlsx)
        </button>
        <button className="ghost-btn" onClick={onDemo}>
          🧪 샘플 데이터로 보기
        </button>

        <div className="security-box">
          <h3>🔒 데이터 보안 안내</h3>
          <ul>
            <li>
              업로드한 파일은 <strong>이 컴퓨터의 브라우저 안에서만</strong>{" "}
              처리·보관됩니다.
            </li>
            <li>서버 전송, 외부 저장, 저장소(GitHub) 업로드가 일절 없습니다.</li>
            <li>보관된 데이터는 화면 상단의 ‘삭제’ 버튼으로 언제든 지울 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
