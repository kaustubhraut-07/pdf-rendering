import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";
import CustomModal from "./Modal"; 

function TestPdfScroll(props) {
  const [numPages, setNumPages] = useState(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [textBoxData, setTextBoxData] = useState({});
  const scrollContainerRef = useRef(null);

  const [modelInputText, setModalInputText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelPageNo, setModalPageNo] = useState([]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    props.onDocumentLoadSuccessNumberOfPages(numPages);
  };

  useEffect(() => {
    const storedData = localStorage.getItem("pdfTextBoxData");
    if (storedData) {
      setTextBoxData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pdfTextBoxData", JSON.stringify(textBoxData));
  }, [textBoxData]);

  const updateTextBoxData = (pageNumber, index, newData) => {
    setTextBoxData(prevData => {
      const updatedPageData = [...(prevData[pageNumber] || [])];
      updatedPageData[index] = { ...updatedPageData[index], ...newData };
      return { ...prevData, [pageNumber]: updatedPageData };
    });
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const pages = container.getElementsByClassName('pdfPage');
    const containerTop = container.scrollTop;

    let maxVisibleHeight = 0;
    let mostVisiblePage = 1;

    Array.from(pages).forEach((page, index) => {
      const rect = page.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        mostVisiblePage = index + 1;
      }
    });

    setCurrentVisiblePage(mostVisiblePage);
    if (props.onPageChange) {
      props.onPageChange(mostVisiblePage);
    }
  }, [props]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleAddTageincurrentPage = () => {
    setTextBoxData(prevData => {
      const currentPageData = prevData[currentVisiblePage];
      return {
        ...prevData,
        [currentVisiblePage]: [
          ...(Array.isArray(currentPageData) ? currentPageData : []),
          {
            pageNumber: currentVisiblePage,
            x: 0, 
            y: 0, 
            text: `New Tag ${currentVisiblePage}`,
          },
        ],
      };
    });
  };

  const generateJSONFile = () => {
    const jsonData = Object.entries(textBoxData).flatMap(([pageNumber, tags]) =>
      tags.map(tag => ({
        pageNumber: parseInt(pageNumber, 10),
        x: tag.x,
        y: tag.y,
        text: tag.text,
        textSize: 16,
        textColor: { r: 0, g: 0, b: 0 },
      }))
    );

    const fileData = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const tempUrl = URL.createObjectURL(fileData);

    const link = document.createElement('a');
    link.href = tempUrl;
    link.download = 'scroll_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(tempUrl);
  };

  const handleAddModelInput = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddTextbox = (placeholder) => {
    setModalInputText(placeholder);
  };

  const handleModalPageNo = (pageNo) => {
    setModalPageNo(prevdata => [...prevdata, pageNo]);
  };

  return (
    <div className="pdf-div">
      <p>
        Page {currentVisiblePage} of {numPages}
      </p>
      <div>
        <button onClick={handleAddTageincurrentPage}>Add Tag</button>
      </div>
      <CustomModal isOpen={isModalOpen} onClose={handleCloseModal} onAddTextbox={handleAddTextbox} onPageNo={handleModalPageNo} />

      <Document file={props.pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
        <div ref={scrollContainerRef} className="pdfPagesContainer" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100vh', width: '100%' }}>
          {numPages &&
            Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
              <div key={pageNumber} className="pdfPage" style={{ marginBottom: "20px", position: "relative" }}>
                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />

                {textBoxData[pageNumber]?.map((tagData, index) => (
                  <Draggable
                    key={`${pageNumber}-${index}`}
                    axis="both"
                    handle=".handle"
                    position={{ x: tagData.x || 0, y: tagData.y || 0 }}
                    scale={1}
                    onDrag={(e, data) => updateTextBoxData(pageNumber, index, { x: data.x, y: data.y })}
                    bounds=".pdfPage"
                  >
                    <div className="handle" style={{ position: "absolute", top: 0, left: 0, color: "white", cursor: "move", border:"1px solid black"}}> 
                      <input
                        type="text"
                        // value={tagData.text}
                        onChange={(e) => updateTextBoxData(pageNumber, index, { text: e.target.value })}
                        placeholder={textBoxData[pageNumber]?.[index]?.text || ""}
                        style={{background:"transparent" , border:"none" , outline:"none" , color:"black"}}
                      />
                    </div>
                  </Draggable>
                ))}
              </div>
            ))}
        </div>
      </Document>
      <button onClick={generateJSONFile} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Download JSON
      </button>
    </div>
  );
}

export default TestPdfScroll;