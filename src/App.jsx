import { useState, useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';
import Papa from 'papaparse';

import { COURSE_MODULES } from './courseData';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import MissionView from './components/MissionView';
import TeamView from './components/TeamView';
import QuizzesView from './components/QuizzesView';
import QuizRunnerView from './components/QuizRunnerView';
import Footer from './components/Footer';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

  // --- effects (same as original) ---
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
        transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
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
          console.error(`Error parsing CSV from ${activeModule.csvUrl}:`, error);
          setCurrentQuestions([]);
          setIsLoadingQuiz(false);
        }
      });
    } else {
      setCurrentQuestions(activeModule.questions || []);
    }
  }, [activeModuleId, activeModule]);

  useEffect(() => {
    if (activeModuleId) {
      localStorage.setItem(`lms_options_${activeModuleId}`, JSON.stringify(selectedOptions));
      localStorage.setItem(`lms_final_${activeModuleId}`, isFinalSubmitted);
    }
  }, [selectedOptions, isFinalSubmitted, activeModuleId]);

  // --- handlers (shared) ---
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
      if (allAnswered) setIsFinalSubmitted(true);
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

  // --- render ---
  return (
    <div style={pageBgStyle}>
      <Navbar
        view={view}
        setView={setView}
        setActiveModuleId={setActiveModuleId}
        isMobile={isMobile}
      />

      <div style={{ paddingTop: isMobile ? '50px' : '65px', marginTop: view === 'home' ? '0' : '30px' }}>
        {view === 'home' && <HomeView setView={setView} isMobile={isMobile} />}
        {view === 'mission' && <MissionView isMobile={isMobile} />}
        {view === 'team' && <TeamView isMobile={isMobile} />}
        {view === 'quizzes' && (
          <QuizzesView
            modules={COURSE_MODULES}
            refreshKey={refreshKey}
            onStartModule={(moduleId) => {
              setActiveModuleId(moduleId);
              setView('quiz-runner');
            }}
            onResetModule={handleResetModule}
          />
        )}
        {view === 'quiz-runner' && activeModule && (
          <QuizRunnerView
            activeModule={activeModule}
            currentQuestions={currentQuestions}
            isLoadingQuiz={isLoadingQuiz}
            selectedOptions={selectedOptions}
            isFinalSubmitted={isFinalSubmitted}
            numPages={numPages}
            currentPageIdx={currentPageIdx}
            pageInputVal={pageInputVal}
            zoomLevel={zoomLevel}
            viewerContainerRef={viewerContainerRef}
            pageRefs={pageRefs}
            onSetNumPages={setNumPages}
            onSetCurrentPageIdx={setCurrentPageIdx}
            onSetPageInputVal={setPageInputVal}
            onSetZoomLevel={setZoomLevel}
            onPageInputSubmit={handlePageInputSubmit}
            onOptionChange={handleOptionChange}
            onFinalSubmit={handleFinalSubmit}
            onCloseModule={closeModule}
            onResetModule={() => handleResetModule(activeModule.id)}
            calculateScore={calculateScore}
            isMobile={isMobile}
          />
        )}
      </div>

      {view === 'home' && <Footer isMobile={isMobile} />}
    </div>
  );
}

const pageBgStyle = {
  backgroundColor: '#f4f5f7',
  minHeight: '100vh',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};