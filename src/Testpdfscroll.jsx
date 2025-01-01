import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";
import CustomModal from "./Modal"; 
import { Button } from "antd";

function TestPdfScroll(props) {
  const [numPages, setNumPages] = useState(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [textBoxData, setTextBoxData] = useState({});
  const scrollContainerRef = useRef(null);


  const [modelInputText, setModalInputText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelPageNo, setModalPageNo] = useState([]);
  const [pageDimensions, setPageDimensions] = useState({});

  const [tagCount, setTagCount] = useState(0);


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
    // console.log(pages , "pages");

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
      const newTag = `Tag ${tagCount + 1}`;
      setTagCount(tagCount + 1);
      return {
        ...prevData,
        [currentVisiblePage]: [
          ...(prevData[currentVisiblePage] || []),
        
          {
            pageNumber: currentVisiblePage,
            x: 0,
            y: 0,
            text: newTag,
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
        width: pageDimensions[pageNumber]?.width || null, 
        height: pageDimensions[pageNumber]?.height || null,
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

  const handlePageLoadSuccess = (page, pageNumber) => {
    const { width, height } = page;
    setPageDimensions((prev) => ({
      ...prev,
      [pageNumber]: { width, height },
    }));
    console.log(`Page ${pageNumber} dimensions:`, { width, height });
  };
  

  return (
    <div className="pdf-div">
      <p>
        Page {currentVisiblePage} of {numPages}
      </p>
      <div>
        <Button type="primary" onClick={handleAddTageincurrentPage}>Add Tag</Button>
      </div>
  
      {/* {isModalOpen && <CustomModal isOpen={isModalOpen} onClose={handleCloseModal} onAddTextbox={handleAddTextbox} onPageNo={handleModalPageNo} />} */}

      <Document file={props.pdfFile} onLoadSuccess={onDocumentLoadSuccess}  > 
        <div ref={scrollContainerRef} className="pdfPagesContainer" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100vh',width:"80%", overflow : 'auto' }}> 
          {/* , height: '100vh', width: '100%' */}
          {numPages &&
            Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
              <div key={pageNumber} className="pdfPage" style={{ position: "relative" }}>
                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} 
                width={595} // Width in points
                height={841} // height in points
                // height={1100}
                onLoadSuccess={(page) => handlePageLoadSuccess(page, pageNumber)}
               />
    {console.log("page dimensions", pageDimensions[pageNumber]?.width   )}
                {textBoxData[pageNumber]?.map((tagData, index) => (
                  <>
                  {console.log("tagData", tagData)}
                  <Draggable
                    key={`${pageNumber}-${index}`}
                    axis="both"
                    handle=".handle"
                    position={{ x: tagData.x, y: 
                      tagData.y 
                      // pageDimensions[pageNumber]?.height - tagData.height 
                    }}
                    scale={1}
                    bounds= {{
                      left: 0,
                      top: 0,
                      right: pageDimensions[pageNumber]?.width - 185 || 0,
                      bottom: pageDimensions[pageNumber]?.height - 26 || 0,
                    }}
                    onDrag={(e, data) => updateTextBoxData(pageNumber, index, { x: data.x, y: data.y })}
                    // bounds=".pdfPage"
                    // bounds="parent"
                    
                  >
                 
                    <div className="handle" style={{ position: "absolute",
                     top: 0, left: 0, 
                     color: "white", cursor: "move" , 
                    // border : "1px solid black"
                    border : "1px solid white",
                    overflow:'auto',
                    // zIndex:1000

                    }}>
                       {/* {console.log("x and y postions", tagData.x, pageDimensions[pageNumber]?.height - tagData.height)} */}
                      <input
                        type="text"
                        value={tagData.text}
                        // value={tagData.text}
                        onChange={(e) => updateTextBoxData(pageNumber, index, { text: e.target.value })}
                        readOnly
                        // size={tagData.text.length } 
                        style={{background:"transparent" , border:"none" , outline:"none" , 
                          // color:"black",
                          color:"white"
                        }}
                        
                      />
                    </div>
                  </Draggable>
                  </>
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