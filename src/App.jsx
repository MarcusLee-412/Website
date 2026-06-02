import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import Papa from 'papaparse'; // Parses the local CSV strings into JSON arrays

// Connect to the official CDN worker for processing PDFs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { COURSE_MODULES } from './courseData'; 
import { TEAM_MEMBERS } from './teamData';

export default function App() {
  const [view, setView] = useState('home');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);

  // Managed dynamic questions parsed directly from the static file paths
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Reader States
  const [numPages, setNumPages] = useState(0);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [pageInputVal, setPageInputVal] = useState('1'); 
  const [zoomLevel, setZoomLevel] = useState(100);

  // Responsive Screen State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const viewerContainerRef = useRef(null);
  const pageRefs = useRef({}); 

  // Track screen size changes to make layouts scale smoothly
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map the single active course module object
  const activeModule = COURSE_MODULES.find(m => m.id === activeModuleId);

  // Reset tracking states when modules shift
  useEffect(() => {
    setNumPages(0);
    setCurrentPageIdx(0);
    setPageInputVal('1');
    pageRefs.current = {};
  }, [activeModuleId]);

  // Keep the input text matching reality when scrolling organically
  useEffect(() => {
    setPageInputVal(String(currentPageIdx + 1));
  }, [currentPageIdx]);

  // AUTOMATIC BACKGROUND CSV FETCH ENGINE
  useEffect(() => {
    if (!activeModule) {
      setCurrentQuestions([]);
      return;
    }

    if (activeModule.csvUrl) {
      setIsLoadingQuiz(true);
      
      Papa.parse(activeModule.csvUrl, {
        download: true,        
        header: true,          
        skipEmptyLines: 'greedy', // <-- UPGRADE 1: Ignores rows that only contain commas or trailing spaces
        transformHeader: (header) => {
          return header.replace(/^\uFEFF/, '').trim();
        },
        complete: (results) => {
          const parsedQuestions = results.data.map((row, index) => {
            // UPGRADE 2: Normalize all keys to lowercase to eliminate case-sensitivity bugs
            const normalizedRow = {};
            Object.keys(row).forEach((key) => {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              normalizedRow[cleanKey] = row[key];
            });

            const id = normalizedRow.id || `q-${index + 1}`;
            
            // Flexible mapping supports "text", "question", "questiontext", etc.
            const text = normalizedRow.text;
            // Flexible mapping supports "optiona", "opta", "choicea", etc.
            const optA = normalizedRow.opta;
            const optB = normalizedRow.optb;
            const optC = normalizedRow.optc;
            const optD = normalizedRow.optd;

            const correct = normalizedRow.answer;

            // Clean up choices and filter out true empty strings/whitespaces
            const options = [optA, optB, optC, optD]
              .map(opt => typeof opt === 'string' ? opt.trim() : opt)
              .filter(Boolean); // Drops undefined, null, and empty strings ""

            return {
              id: String(id),
              text: text ? String(text).trim() : `Question data missing row ${index + 1}`,
              options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
              correctAnswer: correct ? String(correct).trim() : ''
            };
          });
          
          setCurrentQuestions(parsedQuestions);
          setIsLoadingQuiz(false);
        },
        error: (error) => {
          console.error(`Error parsing data from ${activeModule.csvUrl}:`, error);
          setCurrentQuestions([]);
          setIsLoadingQuiz(false);
        }
      });
    } else {
      setCurrentQuestions(activeModule.questions || []);
    }
  }, [activeModuleId]);

  // Save progress automatically
  useEffect(() => {
    if (activeModuleId) {
      localStorage.setItem(`lms_options_${activeModuleId}`, JSON.stringify(selectedOptions));
      localStorage.setItem(`lms_final_${activeModuleId}`, isFinalSubmitted);
    }
  }, [selectedOptions, isFinalSubmitted, activeModuleId]);

  const jumpToPage = (targetIdx) => {
    const targetEl = pageRefs.current[targetIdx];
    if (targetEl && viewerContainerRef.current) {
      viewerContainerRef.current.scrollTo({
        top: targetEl.offsetTop - 15,
        behavior: 'smooth'
      });
      setCurrentPageIdx(targetIdx);
    }
  };

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      jumpToPage(parsed - 1);
    } else {
      setPageInputVal(String(currentPageIdx + 1));
    }
  };

  const handleOptionChange = (questionId, option) => {
    if (!isFinalSubmitted) {
      setSelectedOptions({ ...selectedOptions, [questionId]: option });
    }
  };

  const handleFinalSubmit = () => {
    if (currentQuestions.length > 0) {
      const allAnswered = currentQuestions.every(q => selectedOptions[q.id]);
      if (allAnswered) {
        setIsFinalSubmitted(true);
      }
    }
  };

  const handleResetModule = (moduleId) => {
    localStorage.removeItem(`lms_options_${moduleId}`);
    localStorage.removeItem(`lms_final_${moduleId}`);
    if (activeModuleId === moduleId) {
      setSelectedOptions({});
      setIsFinalSubmitted(false);
      setCurrentPageIdx(0);
      setPageInputVal('1');
    }
    setRefreshKey(prev => prev + 1);
  };

  const closeModule = () => {
    setActiveModuleId(null);
    setView('quizzes');
    setRefreshKey(prev => prev + 1); 
  };

  const calculateScore = () => {
    let score = 0;
    currentQuestions.forEach(q => {
      if (selectedOptions[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  const Navbar = () => {
    const [isAboutHovered, setIsAboutHovered] = useState(false);

    return (
      <header style={{
        ...navHeaderStyle,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '0',
        padding: isMobile ? '15px 20px' : '12px 40px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e5631' }}>Climate Academy</div>
        <nav style={{ 
          display: 'flex', 
          gap: isMobile ? '10px' : '20px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button onClick={() => { setView('home'); setActiveModuleId(null); }} style={navLinkStyle(view === 'home')}>Home</button>
          <button onClick={() => { setView('quizzes'); setActiveModuleId(null); }} style={navLinkStyle(view === 'quizzes')}>Quizzes</button>
          
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => !isMobile && setIsAboutHovered(true)}
            onMouseLeave={() => !isMobile && setIsAboutHovered(false)}
          >
            <button 
              onClick={() => setIsAboutHovered(!isAboutHovered)} 
              style={navLinkStyle(view === 'mission' || view === 'team')}
            >
              About ▼
            </button>
            
            {isAboutHovered && (
              <div style={{
                ...dropdownMenuStyle,
                position: isMobile ? 'static' : 'absolute',
                boxShadow: isMobile ? 'none' : '0 4px 6px rgba(0,0,0,0.1)',
                border: isMobile ? 'none' : '1px solid #e0e0e0',
                backgroundColor: isMobile ? '#f9fafb' : '#ffffff'
              }}>
                <button 
                  onClick={() => { setView('mission'); setActiveModuleId(null); setIsAboutHovered(false); }} 
                  style={dropdownItemStyle}
                >
                  Our Mission
                </button>
                <button 
                  onClick={() => { setView('team'); setActiveModuleId(null); setIsAboutHovered(false); }} 
                  style={dropdownItemStyle}
                >
                  Meet Our Team
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  };

  return (
    <div style={pageBgStyle}>
      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 20px' }}>
        
        {view === 'home' && (
          <div style={{ textAlign: 'center', padding: isMobile ? '30px 0' : '60px 0' }}>
            <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', color: '#1e5631', padding: '0 10px' }}>Welcome to Climate Academy</h1>
            <p style={{ color: '#666', fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: '30px', maxWidth: '600px', margin: '15px auto 30px auto', lineHeight: '1.5' }}>
              Access our library of high-quality learning modules. Course criteria and evaluation assessments are loaded completely dynamically.
            </p>
            <button onClick={() => setView('quizzes')} style={primaryBtnStyle}>
              View Course Library
            </button>
          </div>
        )}

        {view === 'mission' && (
          <div style={{ ...cardStyle, padding: isMobile ? '20px' : '40px' }}>
            <h2 style={{ color: '#1e5631', marginTop: 0 }}>Our Mission</h2>
            <p style={{ lineHeight: '1.6', color: '#444' }}>
              Our mission is to provide accessible, high-quality education to everyone, everywhere.
            </p>
          </div>
        )}

        {view === 'team' && (
          <div style={{ ...cardStyle, padding: isMobile ? '20px' : '40px' }}>
            <h2 style={{ color: '#1e5631', marginTop: 0, textAlign: 'center', marginBottom: isMobile ? '20px' : '40px' }}>Meet Our Team</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
              {TEAM_MEMBERS.map((member) => (
                <div key={member.id} style={teamCardStyle}>
                  <img 
                    src={`${import.meta.env.BASE_URL}${member.photo}`} 
                    alt={member.name} 
                    style={teamPhotoStyle} 
                  />
                  <h3 style={{ margin: '15px 0 5px 0', color: '#222' }}>{member.name}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#1e5631', fontWeight: 'bold', fontSize: '0.9rem' }}>{member.role}</p>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {member.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'quizzes' && (
          <div>
            <h2 style={{ color: '#1e5631' }}>Course Library</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              {COURSE_MODULES.map((module) => {
                const isFinal = localStorage.getItem(`lms_final_${module.id}`) === 'true';
                const savedData = localStorage.getItem(`lms_options_${module.id}`);
                const hasStarted = savedData && Object.keys(JSON.parse(savedData)).length > 0;

                return (
                  <div key={`${module.id}-${refreshKey}`} style={{ 
                    ...cardStyle, 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    justifyContent: 'space-between', 
                    gap: isMobile ? '15px' : '20px',
                    marginBottom: 0 
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: '#222' }}>{module.title}</h3>
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.95rem' }}>{module.description}</p>
                      {isFinal ? (
                        <span style={{ color: '#1e5631', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Completed</span>
                      ) : hasStarted ? (
                        <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱ In Progress</span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 'bold' }}>○ Not Started</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                      <button 
                        onClick={() => { setActiveModuleId(module.id); setView('quiz-runner'); }}
                        style={{ ...primaryBtnStyle, flex: isMobile ? 1 : 'none', textAlign: 'center' }}
                      >
                        {isFinal ? 'View Results' : hasStarted ? 'Resume' : 'Start'}
                      </button>
                      {hasStarted && (
                        <button onClick={() => handleResetModule(module.id)} style={resetOutlineBtnStyle}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'quiz-runner' && activeModule && (() => {
          const totalQuestions = currentQuestions.length;
          const answeredQuestions = Object.keys(selectedOptions).length;
          const allAnswered = answeredQuestions === totalQuestions && totalQuestions > 0;

          return (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
                <button onClick={closeModule} style={backBtnStyle}>← Back</button>
                <button onClick={() => handleResetModule(activeModule.id)} style={resetOutlineBtnStyle}>Reset Progress</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e5631' }}>
                  {isFinalSubmitted 
                    ? `Module Completed` 
                    : `Quiz Progress: ${answeredQuestions} of ${totalQuestions}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '25px' }}>
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      flex: 1, 
                      height: '8px', 
                      backgroundColor: idx < answeredQuestions ? '#1e5631' : '#e0e0e0', 
                      borderRadius: '2px',
                      transition: 'background-color 0.3s ease'
                    }} 
                  />
                ))}
              </div>

              {isFinalSubmitted ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: isMobile ? '30px 15px' : '50px 20px' }}>
                  <h1 style={{ color: '#1e5631', fontSize: '2rem', marginBottom: '10px' }}>Results</h1>
                  <p style={{ fontSize: '1.2rem', color: '#444' }}>
                    You scored <strong>{calculateScore()}</strong> out of <strong>{totalQuestions}</strong>
                  </p>
                  
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
                          {!isCorrect && (
                            <p style={{ margin: 0, color: 'green', fontSize: '0.9rem' }}>Correct Answer: {q.correctAnswer}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <button onClick={closeModule} style={{ ...primaryBtnStyle, width: isMobile ? '100%' : 'auto' }}>Return to Course Library</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={cardStyle}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e5631' }}>{activeModule.title}</h1>
                  </div>

                  {/* INTERACTIVE FILE VIEWER FRAMEWORK */}
                  <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', backgroundColor: '#333b42' }}>
                    
                    {/* Toolbar */}
                    <div style={{ ...viewerToolbarStyle, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0', padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#bbb' }}>
                        <span>Page</span>
                        <input
                          type="number"
                          value={pageInputVal}
                          min={1}
                          max={numPages || 1}
                          onChange={(e) => setPageInputVal(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                          onBlur={handlePageInputSubmit}
                          style={pageInputStyle}
                        />
                        <span>/ {numPages}</span>
                      </div>

                      {/* Zoom controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => setZoomLevel(z => Math.max(50, z - 25))} style={toolbarBtnStyle}>-</button>
                        <button onClick={() => setZoomLevel(z => Math.min(150, z + 25))} style={toolbarBtnStyle}>+</button>
                        <select 
                          value={`${zoomLevel}%`} 
                          onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                          style={{ background: '#222', color: 'white', border: '1px solid #555', fontSize: '0.8rem', padding: '2px' }}
                        >
                          <option value="50%">50%</option>
                          <option value="75%">75%</option>
                          <option value="100%">100%</option>
                          <option value="125%">125%</option>
                          <option value="150%">150%</option>
                        </select>
                        <button onClick={() => setZoomLevel(100)} style={toolbarBtnStyle} title="Reset Zoom">⤢</button>
                      </div>
                    </div>

                    {/* Canvas Container Layout */}
                    <div style={{ display: 'flex', minHeight: '350px', backgroundColor: '#4b5563' }}>
                      
                      <div 
                        ref={viewerContainerRef}
                        style={{ 
                          ...slideContentCanvasStyle, 
                          padding: isMobile ? '15px 8px' : '30px 20px',
                          overflowY: 'auto' 
                        }}
                      >
                        {activeModule && activeModule.pdfUrl ? (
                          <div style={{ 
                            transform: `scale(${zoomLevel / 100})`, 
                            transformOrigin: 'top center',
                            transition: 'transform 0.15s ease-out',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            width: 'fit-content',
                            margin: '0 auto'
                          }}>
                            <Document
                              file={activeModule.pdfUrl}
                              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                              loading={<div style={{ color: '#fff', padding: '20px' }}>Loading PDF...</div>}
                            >
                              {Array.from(new Array(numPages), (el, idx) => (
                                <TrackedPdfPage 
                                  key={idx}
                                  pageNumber={idx + 1} 
                                  index={idx}
                                  rootRef={viewerContainerRef}
                                  pageRefs={pageRefs}
                                  setCurrentPageIdx={setCurrentPageIdx}
                                  isMobile={isMobile}
                                />
                              ))}
                            </Document>
                          </div>
                        ) : (
                          <div style={{ color: '#fff', padding: '40px' }}>No PDF file associated with this module.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ ...cardStyle, padding: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ color: '#1e5631', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      Quiz Questions
                    </h2>

                    {isLoadingQuiz ? (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>Loading quiz dataset...</p>
                    ) : totalQuestions === 0 ? (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No questions detected or failed to reach structural source file mapping paths.</p>
                    ) : (
                      currentQuestions.map((q, index) => {
                        return (
                          <div key={q.id} style={{ marginBottom: '30px' }}>
                            <p style={{ fontWeight: '500', fontSize: '1.05rem', marginBottom: '12px', color: '#222', lineHeight: '1.4' }}>
                              {index + 1}. {q.text}
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: isMobile ? '2px' : '10px', marginBottom: '15px' }}>
                              {q.options && q.options.map((option) => (
                                <label key={option} style={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  gap: '10px', 
                                  cursor: isFinalSubmitted ? 'not-allowed' : 'pointer', 
                                  color: '#444',
                                  fontSize: '0.95rem',
                                  lineHeight: '1.3'
                                }}>
                                  <input 
                                    type="radio" 
                                    name={`module-${activeModule.id}-q-${q.id}`} 
                                    checked={selectedOptions[q.id] === option}
                                    disabled={isFinalSubmitted}
                                    onChange={() => handleOptionChange(q.id, option)}
                                    style={{ accentColor: '#1e5631', width: '18px', height: '18px', marginTop: '1px', flexShrink: 0 }}
                                  />
                                  <span style={{ paddingTop: '1px' }}>{option}</span>
                                </label>
                              ))}
                            </div>

                            {index < currentQuestions.length - 1 && <hr style={dividerStyle} />}
                          </div>
                        );
                      })
                    )}

                    {!isLoadingQuiz && totalQuestions > 0 && (
                      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #1e5631', textAlign: isMobile ? 'left' : 'right' }}>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                          {allAnswered ? 'All questions answered. You may submit the module.' : `Please answer all questions to complete the module.`}
                        </p>
                        <button 
                          onClick={handleFinalSubmit}
                          disabled={!allAnswered}
                          style={{
                            ...primaryBtnStyle,
                            backgroundColor: allAnswered ? '#1e5631' : '#9e9e9e',
                            cursor: allAnswered ? 'pointer' : 'not-allowed',
                            padding: '12px 24px',
                            fontSize: '1.05rem',
                            width: isMobile ? '100%' : 'auto'
                          }}
                        >
                          Final Submit & View Results
                        </button>
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function TrackedPdfPage({ pageNumber, index, rootRef, pageRefs, setCurrentPageIdx, isMobile }) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current || !rootRef.current) return;

    const el = elementRef.current;
    pageRefs.current[index] = el; 

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCurrentPageIdx(index);
        }
      },
      {
        root: rootRef.current,
        threshold: 0.2, 
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      delete pageRefs.current[index];
    };
  }, [index, rootRef, pageRefs, setCurrentPageIdx]);

  // Calculate safe bounding width for mobile to ensure the canvas doesn't clip offscreen edges
  const calculatedWidth = isMobile ? Math.min(600, window.innerWidth - 40) : 600;

  return (
    <div 
      ref={elementRef} 
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '4px', backgroundColor: '#fff', marginBottom: '10px' }}
    >
      <Page 
        pageNumber={pageNumber} 
        width={calculatedWidth} 
        renderTextLayer={false} 
        renderAnnotationLayer={false} 
      />
    </div>
  ); 
}

// --- CSS-IN-JS INLINE STYLES ---
const pageBgStyle = { backgroundColor: '#f4f5f7', minHeight: '100vh', paddingBottom: '60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const navHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 40px', borderBottom: '1px solid #e0e0e0', marginBottom: '30px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' };
const navLinkStyle = (isActive) => ({ background: 'none', border: 'none', borderBottom: isActive ? '2px solid #1e5631' : '2px solid transparent', color: isActive ? '#1e5631' : '#555', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', padding: '8px 12px', fontSize: '1rem' });
const dropdownMenuStyle = { position: 'absolute', top: '100%', left: '0', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', minWidth: '150px', zIndex: 1000, overflow: 'hidden' };
const dropdownItemStyle = { background: 'none', border: 'none', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', color: '#555', borderBottom: '1px solid #eee', width: '100%' };
const cardStyle = { backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box' };
const teamCardStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #eee', boxSizing: 'border-box' };
const teamPhotoStyle = { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1e5631' };
const primaryBtnStyle = { padding: '10px 20px', backgroundColor: '#1e5631', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem', transition: 'background-color 0.2s', boxSizing: 'border-box' };
const resetOutlineBtnStyle = { padding: '8px 12px', color: '#d32f2f', border: '1px solid #d32f2f', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' };
const backBtnStyle = { background: 'transparent', border: 'none', color: '#1e5631', cursor: 'pointer', fontSize: '1rem', fontWeight: '500', padding: 0 };
const viewerToolbarStyle = { backgroundColor: '#2a3137', color: '#dfdfdf', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', userSelect: 'none' };
const pageInputStyle = { width: '45px', background: '#1a1f22', color: '#fff', border: '1px solid #555', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem', padding: '3px 0', fontWeight: 'bold', MozAppearance: 'textfield' };
const toolbarBtnStyle = { background: '#3a4147', color: '#fff', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const slideContentCanvasStyle = { flex: 1, padding: '30px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', overflowX: 'auto', maxHeight: '550px' };
const dividerStyle = { border: 'none', borderTop: '1px solid #e0e0e0', marginTop: '25px', marginBottom: '25px' };