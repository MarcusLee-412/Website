import { useEffect, useRef } from 'react';
import { Page } from 'react-pdf';

export default function TrackedPdfPage({ pageNumber, index, rootRef, pageRefs, setCurrentPageIdx, isMobile }) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current || !rootRef.current) return;
    const el = elementRef.current;
    pageRefs.current[index] = el;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCurrentPageIdx(index);
      },
      { root: rootRef.current, threshold: 0.2 }
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
      <Page pageNumber={pageNumber} width={calculatedWidth} renderTextLayer={false} renderAnnotationLayer={false} />
    </div>
  );
}