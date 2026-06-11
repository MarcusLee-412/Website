import { Document, Page } from 'react-pdf';
import TrackedPdfPage from './TrackedPdfPage';

export default function QuizRunnerView({
  activeModule,
  currentQuestions,
  isLoadingQuiz,
  selectedOptions,
  isFinalSubmitted,
  numPages,
  currentPageIdx,
  pageInputVal,
  zoomLevel,
  viewerContainerRef,
  pageRefs,
  onSetNumPages,
  onSetCurrentPageIdx,
  onSetPageInputVal,
  onSetZoomLevel,
  onPageInputSubmit,
  onOptionChange,
  onFinalSubmit,
  onCloseModule,
  onResetModule,
  calculateScore,
  isMobile
}) {
  const totalQuestions = currentQuestions.length;
  const answeredQuestions = Object.keys(selectedOptions).length;
  const allAnswered = answeredQuestions === totalQuestions && totalQuestions > 0;

  const handleZoomOut = () => onSetZoomLevel(z => Math.max(50, z - 25));
  const handleZoomIn = () => onSetZoomLevel(z => Math.min(150, z + 25));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header buttons */}
      <div style={{ maxWidth: '1000px',
              margin: '0 auto',display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
        <button onClick={onCloseModule} style={backBtnStyle}>← Back</button>
        <button onClick={onResetModule} style={resetOutlineBtnStyle}>Reset Progress</button>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: '1000px',
              margin: '0 auto',display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e5631' }}>
          {isFinalSubmitted ? 'Module Completed' : `Quiz Progress: ${answeredQuestions} of ${totalQuestions}`}
        </span>
      </div>
      <div style={{maxWidth: '1000px',
              margin: '0 auto', display: 'flex', gap: '4px', marginBottom: '25px' }}>
        {Array.from({ length: totalQuestions }).map((_, idx) => (
          <div key={idx} style={{
            flex: 1,
            height: '8px',
            backgroundColor: idx < answeredQuestions ? '#1e5631' : '#e0e0e0',
            borderRadius: '2px',
            transition: 'background-color 0.3s ease'
          }} />
        ))}
      </div>

      {isFinalSubmitted ? (
        // RESULTS VIEW
        <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '30px 15px' : '50px 20px' }}>
          <h1 style={{ color: '#1e5631', fontSize: '2rem', marginBottom: '10px' }}>Results</h1>
          <p style={{ fontSize: '1.2rem', color: '#444' }}>
            You scored <strong>{calculateScore()}</strong> out of <strong>{totalQuestions}</strong>
          </p>

          {/* Review section */}
          <div style={{ marginTop: '30px', textAlign: 'left', background: '#f9fafb', padding: isMobile ? '15px' : '20px', borderRadius: '8px', display: 'inline-block', maxWidth: '600px', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Review:</h3>
            {currentQuestions.map((q, i) => {
              const userAns = selectedOptions[q.id];
              const isCorrect = userAns === q.correctAnswer;
              return (
                <div key={q.id} style={{ marginBottom: '15px', borderBottom: i !== totalQuestions - 1 ? '1px solid #ddd' : 'none', paddingBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{i + 1}. {q.text}</p>
                  <p style={{ margin: '0 0 5px 0', color: isCorrect ? 'green' : '#d32f2f' }}>
                    Your Answer: {userAns} {isCorrect ? '✓' : '✗'}
                  </p>
                  {!isCorrect && <p style={{ margin: 0, color: 'green', fontSize: '0.9rem' }}>Correct Answer: {q.correctAnswer}</p>}
                </div>
              );
            })}
          </div>

          {/* Certificate request */}
          <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #eee' }}>
            <h2 style={{ color: '#1e5631', marginBottom: '20px' }}>Request Your Certificate</h2>
            <div style={{ width: '100%', maxWidth: '350px', height: '250px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', borderRadius: '8px' }}>
              <img src="random/certificate.jpeg" alt="CarbonCare InnoLab" style={{ width: '400px', height: '250px', objectFit: 'contain', backgroundColor: '#fff' }} />
            </div>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input type="email" placeholder="Enter your email address" style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000' }} />
              <button style={{ ...primaryBtnStyle, width: '100%' }}>Request Certificate</button>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button onClick={onCloseModule} style={{ ...primaryBtnStyle, width: isMobile ? '100%' : 'auto' }}>Return to Course Library</button>
          </div>
        </div>
      ) : (
        // ACTIVE QUIZ + PDF VIEWER
        <>
          <div style={cardStyle}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e5631' }}>{activeModule.title}</h1>
          </div>

          {/* PDF Viewer with toolbar */}
          <div style={{ ...cardStyle,maxWidth: '1000px',margin: '0 auto', padding: 0, overflow: 'hidden', backgroundColor: '#333b42' }}>
            <div style={{ ...viewerToolbarStyle, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0', padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#bbb' }}>
                <span>Page</span>
                <input type="number" value={pageInputVal} min={1} max={numPages || 1}
                  onChange={(e) => onSetPageInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onPageInputSubmit()}
                  onBlur={onPageInputSubmit}
                  style={pageInputStyle} />
                <span>/ {numPages}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={handleZoomOut} style={toolbarBtnStyle}>-</button>
                <button onClick={handleZoomIn} style={toolbarBtnStyle}>+</button>
                <select value={`${zoomLevel}%`} onChange={(e) => onSetZoomLevel(parseInt(e.target.value))} style={{ background: '#222', color: 'white', border: '1px solid #555', fontSize: '0.8rem', padding: '2px' }}>
                  <option value="50%">50%</option><option value="75%">75%</option><option value="100%">100%</option><option value="125%">125%</option><option value="150%">150%</option>
                </select>
                <button onClick={() => onSetZoomLevel(100)} style={toolbarBtnStyle} title="Reset Zoom">⤢</button>
              </div>
            </div>

            <div style={{ display: 'flex', minHeight: '350px', backgroundColor: '#4b5563' }}>
              <div ref={viewerContainerRef} style={{ ...slideContentCanvasStyle, padding: isMobile ? '15px 8px' : '30px 20px', overflowY: 'auto' }}>
                {activeModule.pdfUrl ? (
                  <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out', display: 'flex', flexDirection: 'column', gap: '20px', width: 'fit-content', margin: '0 auto' }}>
                    <Document file={activeModule.pdfUrl} onLoadSuccess={({ numPages }) => onSetNumPages(numPages)} loading={<div style={{ color: '#fff', padding: '20px' }}>Loading PDF...</div>}>
                      {Array.from(new Array(numPages), (_, idx) => (
                        <TrackedPdfPage key={idx} pageNumber={idx + 1} index={idx}
                          rootRef={viewerContainerRef} pageRefs={pageRefs}
                          setCurrentPageIdx={onSetCurrentPageIdx} isMobile={isMobile} />
                      ))}
                    </Document>
                  </div>
                ) : (
                  <div style={{ color: '#fff', padding: '40px' }}>No PDF file associated with this module.</div>
                )}
              </div>
            </div>
          </div>

          {/* Quiz Questions */}
          <div style={{ ...cardStyle, maxWidth: '1000px',
              margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
            <h2 style={{ color: '#1e5631', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Quiz Questions</h2>
            {isLoadingQuiz ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Loading quiz dataset...</p>
            ) : totalQuestions === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No questions detected or failed to reach structural source file mapping paths.</p>
            ) : (
              currentQuestions.map((q, index) => (
                <div key={q.id} style={{ marginBottom: '30px' }}>
                  <p style={{ fontWeight: '500', fontSize: '1.05rem', marginBottom: '12px', color: '#222', lineHeight: '1.4', textAlign: "justify" }}>
                    {index + 1}. {q.text}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: isMobile ? '2px' : '10px', marginBottom: '15px' }}>
                    {q.options.map((option) => (
                      <label key={option} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: isFinalSubmitted ? 'not-allowed' : 'pointer', color: '#444', fontSize: '0.95rem', lineHeight: '1.3' }}>
                        <input type="radio" name={`module-${activeModule.id}-q-${q.id}`}
                          checked={selectedOptions[q.id] === option} disabled={isFinalSubmitted}
                          onChange={() => onOptionChange(q.id, option)}
                          style={{ accentColor: '#1e5631', width: '18px', height: '18px', marginTop: '1px', flexShrink: 0 }} />
                        <span style={{ paddingTop: '1px' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                  {index < currentQuestions.length - 1 && <hr style={dividerStyle} />}
                </div>
              ))
            )}

            {!isLoadingQuiz && totalQuestions > 0 && (
              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #1e5631', textAlign: isMobile ? 'left' : 'right' }}>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {allAnswered ? 'All questions answered. You may submit the module.' : `Please answer all questions to complete the module.`}
                </p>
                <button onClick={onFinalSubmit} disabled={!allAnswered}
                  style={{
                    ...primaryBtnStyle,
                    backgroundColor: allAnswered ? '#1e5631' : '#9e9e9e',
                    cursor: allAnswered ? 'pointer' : 'not-allowed',
                    padding: '12px 24px',
                    fontSize: '1.05rem',
                    width: isMobile ? '100%' : 'auto'
                  }}>
                  Final Submit & View Results
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Styles (reused from original) ---
const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '6px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  boxSizing: 'border-box'
};

const primaryBtnStyle = {
  padding: '10px 20px',
  backgroundColor: '#1e5631',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '0.95rem',
  transition: 'background-color 0.2s',
  boxSizing: 'border-box'
};

const resetOutlineBtnStyle = {
  padding: '8px 12px',
  color: '#d32f2f',
  border: '1px solid #d32f2f',
  backgroundColor: 'transparent',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const backBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#1e5631',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  padding: 0
};

const viewerToolbarStyle = {
  backgroundColor: '#2a3137',
  color: '#dfdfdf',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px',
  userSelect: 'none'
};

const pageInputStyle = {
  width: '45px',
  background: '#1a1f22',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: '4px',
  textAlign: 'center',
  fontSize: '0.85rem',
  padding: '3px 0',
  fontWeight: 'bold',
  MozAppearance: 'textfield'
};

const toolbarBtnStyle = {
  background: '#3a4147',
  color: '#fff',
  border: 'none',
  padding: '6px 10px',
  cursor: 'pointer',
  borderRadius: '4px',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const slideContentCanvasStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  overflowY: 'auto',
  overflowX: 'auto',
  maxHeight: '550px'
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #e0e0e0',
  marginTop: '25px',
  marginBottom: '25px'
};