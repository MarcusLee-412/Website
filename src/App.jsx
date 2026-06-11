import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import Papa from 'papaparse'; 

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { COURSE_MODULES } from './courseData'; 
import { TEAM_MEMBERS } from './teamData';

export default function App() {
  const [view, setView] = useState('home');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const [numPages, setNumPages] = useState(0);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [pageInputVal, setPageInputVal] = useState('1'); 
  const [zoomLevel, setZoomLevel] = useState(100);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const viewerContainerRef = useRef(null);
  const pageRefs = useRef({}); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeModule = COURSE_MODULES.find(m => m.id === activeModuleId);
  useEffect(() => {
    setNumPages(0);
    setCurrentPageIdx(0);
    setPageInputVal('1');
    pageRefs.current = {};
  }, [activeModuleId]);

  useEffect(() => {
    setPageInputVal(String(currentPageIdx + 1));
  }, [currentPageIdx]);

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
        skipEmptyLines: 'greedy', 
        transformHeader: (header) => {
          return header.replace(/^\uFEFF/, '').trim();
        },
        complete: (results) => {
          const parsedQuestions = results.data.map((row, index) => {
            const normalizedRow = {};
            Object.keys(row).forEach((key) => {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              normalizedRow[cleanKey] = row[key];
            });

            const id = normalizedRow.id || `q-${index + 1}`;
            const text = normalizedRow.text;
            const optA = normalizedRow.opta;
            const optB = normalizedRow.optb;
            const optC = normalizedRow.optc;
            const optD = normalizedRow.optd;
            const correct = normalizedRow.answer;

            const options = [optA, optB, optC, optD]
              .map(opt => typeof opt === 'string' ? opt.trim() : opt)
              .filter(Boolean); 

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
        flexDirection: 'row', // Force row layout
        justifyContent: 'space-between', // Keep logo left, nav right
        padding: isMobile ? '10px 15px' : '12px 40px',
        gap: '10px'
      }}>
        {/* Logo acting as Home button */}
        <button 
          onClick={() => { setView('home'); setActiveModuleId(null); }} 
          style={{ 
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', 
            fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1.2rem', color: '#1e5631' 
          }}
        >
          Climate Academy
        </button>

        <nav style={{ 
          display: 'flex', 
          gap: '8px', // Tightened gap for mobile
          alignItems: 'center',
          flexWrap: 'nowrap' // Prevent wrapping to second row
        }}>
          <button 
            onClick={() => { setView('quizzes'); setActiveModuleId(null); }} 
            style={{ ...navLinkStyle(view === 'quizzes'), fontSize: isMobile ? '0.85rem' : '1rem', padding: '8px 5px' }}
          >
            Quizzes
          </button>
          
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => !isMobile && setIsAboutHovered(true)}
            onMouseLeave={() => !isMobile && setIsAboutHovered(false)}
          >
            <button 
              onClick={() => setIsAboutHovered(!isAboutHovered)} 
              style={{ ...navLinkStyle(view === 'mission' || view === 'team'), fontSize: isMobile ? '0.85rem' : '1rem', padding: '8px 5px' }}
            >
              About ▼
            </button>
            
            {isAboutHovered && (
              <div style={{
                ...dropdownMenuStyle,
                // Change positioning for mobile to ensure it doesn't break layout
                position: isMobile ? 'absolute' : 'absolute', 
                top: isMobile ? '100%' : '100%', 
                left: isMobile ? 'auto' : '0',
                right: isMobile ? '20px' : 'auto', // Align to the right on mobile
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                marginTop: '5px' // Adds a little breathing room
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
    <div style={{ ...pageBgStyle, paddingBottom: view === 'home' ? '0' : '60px' }}>
      <Navbar />

      {/* Offset container to account for the fixed navbar height */}
      <div style={{ 
        paddingTop: isMobile ? '50px' : '65px',
        marginTop: view === 'home' ? '0' : '30px'
      }}>
        {view === 'home' ? (
          <div style={{ width: '100%', backgroundColor: '#fff' }}>
            
            {/* Hero Section */}
<section style={{ 
  backgroundColor: '#f5f0e6', // Matching the beige background
  padding: isMobile ? '40px 20px' : '80px 40px',
  boxSizing: 'border-box'
}}>
  <div style={{ 
    maxWidth: '1100px', 
    margin: '0 auto', 
    display: 'flex', 
    flexDirection: isMobile ? 'column' : 'row', 
    alignItems: 'center', 
    gap: '60px' 
  }}>
    {/* Text Content */}
    <div style={{ flex: 1 }}>
      <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', margin: '0 0 20px 0', fontWeight: '800', lineHeight: '1.1', color: '#1a1a1a'}}>
        Master Climate Policy, Finance & Real-World Solutions
      </h1>
      <p style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 30px 0', color: '#4a4a4a', textAlign: 'justify' }}> 
        Structured courses to access for students/professionals with environment entities, interactive modules, quizzes, and certification.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center'  }}>
        <button onClick={() => setView('quizzes')} style={primaryBtnStyle}>Start Learning</button>
        <button onClick={() => setView('quizzes')} style={{ ...resetOutlineBtnStyle, borderColor: '#333', color: '#333' }}>Explore Courses</button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '40px', marginTop: '40px', justifyContent: 'center'}}>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>5</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>Courses</div>
        </div>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>15+</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>Modules</div>
        </div>
        <div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>100%</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>Free</div>
        </div>
      </div>
    </div>

    {/* Image Container */}
    <div style={{ flex: 1, width: '100%' }}>
      <img 
        src="random/test_random.jpeg" 
        alt="Climate Academy Classroom" 
        style={{ width: '100%', height: 'auto', display: 'block' }} 
      />
    </div>
  </div>
</section>

            {/* Content Section 1: Intro & Values List */}
            <section style={{ padding: isMobile ? '40px 20px' : '80px 20px', backgroundColor: '#ffffff' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto', color: '#222' }}>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '20px' }}>
                  Our mission is to build a future in which people live in harmony with nature. To deliver this mission, we work to conserve and restore biodiversity, the web that supports all life on Earth; to reduce humanity's environmental footprint; and to ensure the sustainable use of natural resources to support current and future generations.
                </p>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '25px' }}>
                  We celebrate and respect diversity in nature and among the people, partners, and communities with whom we work. Across the many cultures and individuals that represent Climate Academy, we are unified by one mission, one brand, and one common set of values:
                </p>
                <ul style={{ fontSize: '1.1rem', lineHeight: '1.7', paddingLeft: '20px', color: '#333' }}>
                  <li style={{ marginBottom: '12px' }}><strong>Courage:</strong> We demonstrate courage through our actions, we work for change where it's needed, and we inspire people and institutions to tackle the greatest threats to nature and the future of the planet, which is our home.</li>
                  <li style={{ marginBottom: '12px' }}><strong>Integrity:</strong> We live the principles we call on others to meet. We act with integrity, accountability, and transparency, and we rely on facts and science to guide us and to ensure we learn and evolve.</li>
                  <li style={{ marginBottom: '12px' }}><strong>Respect:</strong> We honor the voices and knowledge of the people and communities that we serve, and we work to secure their rights to a sustainable future.</li>
                  <li style={{ marginBottom: '12px' }}><strong>Collaboration:</strong> We deliver impact at the scale of the challenges we face through the power of collective action and innovation.</li>
                </ul>
              </div>
            </section>

          </div>
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '0 12px' : '0 20px' }}>
            
            {/* --- EXISTING VIEWS --- */}
            {view === 'mission' && (
              <div style={{ ...cardStyle, padding: isMobile ? '20px' : '40px' }}>
                <h2 style={{ color: '#1e5631', marginTop: 0 }}>Our Mission</h2>
                <p style={{ lineHeight: '1.6', color: '#444' }}>
                  Our mission is to provide accessible, high-quality education to everyone, everywhere.
                </p>
              </div>
            )}

            {view === 'team' && (
              <div style={{ padding: isMobile ? '20px' : '40px' }}> {/* Removed ...cardStyle */}
                <h2 style={{ color: '#1e5631', marginTop: 0, marginBottom: '40px' }}>Meet the team</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {TEAM_MEMBERS.map((member) => (
                    <div key={member.id} style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row', 
                      alignItems: isMobile ? 'center' : 'flex-start', 
                      gap: '30px',
                      paddingBottom: '20px' // Added some breathing room between entries
                    }}>
                      {/* Left Column: Photo, Name, and Role */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: isMobile ? '100%' : '200px',
                        flexShrink: 0 
                      }}>
                        <img 
                          src={`${import.meta.env.BASE_URL}${member.photo}`} 
                          alt={member.name} 
                          style={{ ...teamPhotoStyle, width: '150px', height: '150px' }} 
                        />
                        <h3 style={{ margin: '15px 0 5px 0', color: '#222', textAlign: 'center' }}>{member.name}</h3>
                        <p style={{ margin: 0, color: '#1e5631', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                          {member.role}
                        </p>
                      </div>

                      {/* Right Column: Description */}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, color: '#555', fontSize: '1rem', lineHeight: '1.6', textAlign: 'justify'}}>
                          {member.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'quizzes' && (
              <div>
                <h2 style={{ color: '#1e5631', marginTop: 0 }}>Course Library</h2>
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
                      
                      {/* Review Section */}
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

                      {/* Certificate Request Section */}
                      <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #eee' }}>
                        <h2 style={{ color: '#1e5631', marginBottom: '20px' }}>Request Your Certificate</h2>
                        
                        {/* Certificate Placeholder Image */}
                        <div style={{
                           
                          width: '100%', 
                          maxWidth: '350px', 
                          height: '250px', 
                          backgroundColor: '#f0f0f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '0 auto 20px auto',
                          borderRadius: '8px'
                        }}>
                          <img 
                            src= "random/certificate.jpeg" 
                            alt="CarbonCare InnoLab" 
                            style={{ 
                              margin: '100%', // Centers the image horizontally
                              width: '400px', 
                              height: '250px' , 
                              objectFit: 'contain', 
                              backgroundColor: '#fff' 
                            }} 
                          />
                        </div>

                        {/* Email Input */}
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                          <input 
                            type="email" 
                            placeholder="Enter your email address" 
                            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box',backgroundColor: '#fff', color: '#000' }} 
                          />
                          <button style={{ ...primaryBtnStyle, width: '100%' }}>Request Certificate</button>
                        </div>
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

                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', backgroundColor: '#333b42' }}>
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
                                <p style={{ fontWeight: '500', fontSize: '1.05rem', marginBottom: '12px', color: '#222', lineHeight: '1.4', textAlign: "justify"}}>
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
        )}
      </div>
      {view === 'home' && <Footer isMobile={isMobile} />}
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

const pageBgStyle = { backgroundColor: '#f4f5f7', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };

// Updated navigation styles to make it fixed to the top of the screen
const navHeaderStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  backgroundColor: '#ffffff', 
  borderBottom: '1px solid #e0e0e0', 
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 1000,
  boxSizing: 'border-box'
};

const Footer = ({ isMobile }) => {
  return (
    <footer style={{ 
      backgroundColor: '#f5f0e6', 
      padding: '40px 20px', 
      borderTop: '1px solid #e0e0e0',
      marginTop: '60px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: '40px',
        justifyContent: 'space-between' 
      }}>
        
        {/* Email Feedback - Centered Container */}
        <div style={{ flex: 1, backgroundColor: '#f97316', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Contact Us</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: '0.9' }}>Send us your feedback or questions.</p>
          
          {/* Centered Inputs */}
          <input type="text" placeholder="Name" style={{ width: '80%', marginBottom: '10px', padding: '8px',backgroundColor: '#fff',  border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto', color: '#000' }} />
          <input type="email" placeholder="Email" style={{ width: '80%', marginBottom: '10px', padding: '8px',backgroundColor: '#fff', border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto', color: '#000' }} />
          <textarea placeholder="Message" style={{ width: '80%', height: '80px', marginBottom: '10px', padding: '8px',backgroundColor: '#fff',  border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto' }} />
          
          {/* Centered Button */}
          <button style={{ width: '80%', padding: '10px', backgroundColor: '#fff', color: '#f97316', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'block', margin: '0 auto' }}>Send Message</button>
        </div>

        {/* Collaborator 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img 
            src= "teamphotos/ZS.jpeg" 
            alt="Zeshan Foundation" 
            style={{ 
              margin: '0 auto 10px auto', // Centers the image horizontally
              width: '180px', 
              height: '90px' , 
              objectFit: 'contain', 
              backgroundColor: '#fff' 
            }} 
          />
          <h4 style={{ margin: '0 0 5px 0' }}>CarbonCare InnoLab</h4>
          <p style={{ fontSize: '0.85rem', color: '#555' }}>In Association with.</p>
        </div>

        {/* Collaborator 2 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img 
            src= "teamphotos/CCIL.jpeg" 
            alt="CarbonCare InnoLab" 
            style={{ 
              margin: '0 auto 10px auto', // Centers the image horizontally
              width: '180px', 
              height: '90px' , 
              objectFit: 'contain', 
              backgroundColor: '#fff' 
            }} 
          />
          <h4 style={{ margin: '0 0 5px 0' }}>CarbonCare InnoLab</h4>
          <p style={{ fontSize: '0.85rem', color: '#555' }}>In Association with.</p>
        </div>

      </div>
    </footer>
  ); 
};

const navLinkStyle = (isActive) => ({ background: 'none', border: 'none', borderBottom: isActive ? '2px solid #1e5631' : '2px solid transparent', color: isActive ? '#1e5631' : '#555', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', padding: '8px 12px', fontSize: '1rem' });
const dropdownMenuStyle = { position: 'absolute', top: '100%', left: '0', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', minWidth: '120px', zIndex: 1000, overflow: 'hidden' };
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