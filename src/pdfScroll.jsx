// import React, { useEffect, useState, useRef } from "react";
// import { Document, Page } from "react-pdf";
// import Draggable from "react-draggable";

// function PdfScroll(props) {
//   const [numPages, setNumPages] = useState();
//   const [pageNumber, setPageNumber] = useState(1);
//   const textBoxRef = useRef(null);
//   const [textboxPosition, setTextboxPosition] = useState({ x: 0, y: 0 });
//   const [newRenderWidth, setNewRenderWidth] = useState(null);
//   const [textBox, setTextbox] = useState({});

//   function onDocumentLoadSuccess({ numPages }) {
//     setNumPages(numPages);
//     props.onDocumentLoadSuccessNumberOfPages(numPages);
//   }

//   function getPdfPageSize() {
//     const pdfPage = document.querySelector(".pdfPage");
//     if (pdfPage) {
//       setNewRenderWidth(pdfPage.offsetWidth);
//     }
//   }

//   useEffect(() => {
//     getPdfPageSize();
//   }, []);

//   useEffect(() => {
//     const localdata = localStorage.getItem(`${props.pageNumber}`);

//     if (localdata) {
//       const localstrdata = JSON.parse(localdata);
//       setTextbox(prevdata => ({
//         ...prevdata,
//         [props.pageNumber]: localstrdata,
//       }));
//       setTextboxPosition({
//         x: localstrdata?.x || 0,
//         y: localstrdata?.y || 0,
//       });
//     } else {
//       setTextbox(prevdata => ({
//         ...prevdata,
//         [props.pageNumber]: { text: "", x: 0, y: 0 },
//       }));
//     }
//   }, [props.pageNumber]);

//   const updateTextbox = (newData) => {
//     setTextbox(prevdata => {
//       const updatedData = {
//         ...prevdata,
//         [props.pageNumber]: {
//           text: newData || prevdata[props.pageNumber]?.text,
//           x: textboxPosition.x,
//           y: textboxPosition.y
//         }
//       };

//       localStorage.setItem(`${props.pageNumber}`, JSON.stringify(updatedData[props.pageNumber]));

//       return updatedData;
//     });
//   };

//   const handleDrag = (e, dragData) => {
//     setTextboxPosition({ x: dragData.x, y: dragData.y });
//   };

//   const handleChangeText = (e) => {
//     setTextbox(prevTexts => ({
//       ...prevTexts,
//       [props.pageNumber]: e.target.value
//     }));
//   };

//   const handleScroll = (e) => {
//     if (e.deltaY > 0) {
//       setPageNumber(prevPage => Math.min(numPages, prevPage + 1));
//     } else {
//       setPageNumber(prevPage => Math.max(1, prevPage - 1));
//     }
//   };

//   return (
//     <div className="pdf-div" onWheel={handleScroll}>
//       <p>
//         Page {props.pageNumber} of {numPages}
//       </p>
//       <Document
//         file={props.pdfFile}
//         onLoadSuccess={onDocumentLoadSuccess}
//       >
//         <div className="pdfPagesContainer" style={{ position: 'relative' ,overflowY: 'auto', overflowX: 'hidden', height: 'max-h-screen' , width : '100%'}}>
//           {numPages &&
//             Array.from({ length: numPages }, (_, index) => index + 1).map(
//               (pageNumber) => (
//                 <div key={pageNumber} className="pdfPage" style={{ marginBottom: '20px', position: 'relative' }}>
//                   <Page pageNumber={pageNumber}  renderTextLayer={false} renderAnnotationLayer={false}/>
//                   <Draggable
//                     axis="both"
//                     handle=".handle"
//                     position={textboxPosition}
//                     scale={1}
//                     onDrag={handleDrag}
//                     bounds=".pdfPage"
//                   >
//                     <div
//                       className="handle"
//                       style={{
//                         position: 'absolute',
//                         top: 0,
//                         left: 0,
//                         // background: 'rgba(0, 0, 0, 0.5)',
//                         color: 'white',
//                         padding: '10px',
//                         cursor: 'move'
//                       }}
//                     >
//                       <input
//                         type="text"
//                         value={textBox[pageNumber]?.text || ""}
//                         onChange={(e) => updateTextbox(e.target.value)}
//                       />
//                     </div>
//                   </Draggable>
//                 </div>
//               )
//             )}
//         </div>
//       </Document>

//       {/* <button onClick={generateJSONFile} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
//         Download JSON
//       </button> */}
//     </div>
//   );
// }

// export default PdfScroll;





import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";
import CustomModal from "./Modal";

function PdfScroll(props) {
  const [numPages, setNumPages] = useState(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [textBoxData, setTextBoxData] = useState({});
  const scrollContainerRef = useRef(null);

  const[modelInputText , setModalInputText] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const[modelPageNo , setModalPageNo] = useState([]);


  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    props.onDocumentLoadSuccessNumberOfPages(numPages);
  };

  useEffect(() => {
    const localdata = localStorage.getItem(`${props.pageNumber}`);

    if (localdata) {
      const localstrdata = JSON.parse(localdata);
      setTextBoxData(prevdata => ({
        ...prevdata,
        [props.pageNumber]: localstrdata,
      }));
    } else {
      setTextBoxData(prevdata => ({
        ...prevdata,
        [props.pageNumber]: { text: "", x: 0, y: 0 },
      }));
    }
  }, [props.pageNumber]);

  const updateTextBoxData = (newData) => {
    setTextBoxData(prevdata => {
      const updatedData = {
        ...prevdata,
        [props.pageNumber]: {
          ...prevdata[props.pageNumber],
          ...newData
        }
      };

      localStorage.setItem(`${props.pageNumber}`, JSON.stringify(updatedData[props.pageNumber]));

      return updatedData;
    });
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
        // console.log("scrolling")
    const container = scrollContainerRef.current;
    const pages = container.getElementsByClassName('pdfPage');
    const containerTop = container.scrollTop;

    let maxVisibleHeight = 0;
    let mostVisiblePage = 1;

    Array.from(pages).forEach((page, index) => {
      const rect = page.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // console.log(rect , "space", containerRect);

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

  const handleDrag = (e, dragData) => {
    updateTextBoxData({ x: dragData.x, y: dragData.y });
  };

  const handleChangeText = (e) => {
    updateTextBoxData({ text: e.target.value });
  };

  const generateJSONFile = () => {
    const jsonData = Object.keys(textBoxData).map(pageNumber => ({
      pageNumber: parseInt(pageNumber, 10),
      x: textBoxData[pageNumber]?.x || 0,
      y: textBoxData[pageNumber]?.y || 0,
      text: textBoxData[pageNumber]?.text || "",
      textSize: 16,
      textColor: { r: 0, g: 0, b: 0 },
    }));

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
    // updateTextBoxData({ text: placeholder });
    setModalInputText(placeholder);
  };
const handleModalPageNo = (pageNo) => {
  // setModalPageNo(pageNo);
  setModalPageNo(prevdata => [...prevdata, pageNo]);
}
console.log(modelPageNo , "modelPageNo")
//   console.log(currentVisiblePage , "currentVisiblePage");

// const handleAddTageincurrentPage = () =>{
  
//   // setTextBoxData(prevData => ({
//   //   ...prevData,
//   //   [currentVisiblePage]: {
//   //     pageNumber: currentVisiblePage,
//   //     x: 0, 
//   //     y: 0, 
//   //     text: `New Tag ${currentVisiblePage}`,
//   //   }
//   // }));
//   setTextBoxData(prevData => ({
//     ...prevData,
//     [currentVisiblePage]: [
//       ...(prevData?.[currentVisiblePage] || []), 
//       {
//         pageNumber: currentVisiblePage,
//         x: 0,
//         y: 0,
//         text: `New Tag ${currentVisiblePage}`,
//       },
//     ],
//   }));
// }

const handleAddTageincurrentPage = () => {
  setTextBoxData(prevData => {
    const currentPageData = prevData[currentVisiblePage]; // Get the current page's data

    return {
      ...prevData,
      [currentVisiblePage]: [
        ...(Array.isArray(currentPageData) ? currentPageData : []), // Check if it's an array
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
  return (
    <div className="pdf-div">
      <p>
        Page {currentVisiblePage} of {numPages}
      </p>
      <div>
        {/* <button onClick={handleAddModelInput}>Open Modal</button> */}
        <button onClick={handleAddTageincurrentPage}>Add Tag</button>
      </div>
      <CustomModal isOpen={isModalOpen} onClose={handleCloseModal} onAddTextbox={handleAddTextbox} onPageNo={handleModalPageNo}  />
      <Document
        file={props.pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
      >
       
        <div ref={scrollContainerRef} className="pdfPagesContainer" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100vh', width: '100%' }}>
          {/* {numPages &&
            Array.from({ length: numPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <div key={pageNumber} className="pdfPage" style={{ marginBottom: '20px', position: 'relative' }}>
                  <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
                  
                  {console.log(currentVisiblePage , "currentVisiblePage" , currentVisiblePage===Number(modelPageNo) , Number(modelPageNo) , "outside conditon")}
                  {
                  // currentVisiblePage === 
                  // pageNumber
                  // Number(modelPageNo)
                  modelPageNo.includes(String(currentVisiblePage))
                   && (
                    <>
                    {console.log(currentVisiblePage , "currentVisiblePage" , currentVisiblePage=== Number(modelPageNo) , Number(modelPageNo) , "indie the coditon")}
                     <Draggable
                     axis="both"
                     handle=".handle"
                     position={{ x: textBoxData[props.pageNumber]?.x || 0, y: textBoxData[props.pageNumber]?.y || 0 }}
                     scale={1}
                     onDrag={handleDrag}
                     bounds=".pdfPage"
                   >
                     <div
                       className="handle"
                       style={{
                         position: 'absolute',
                         top: 0,
                         left: 0,
                         color: 'white',
                         padding: '10px',
                         cursor: 'move'
                       }}
                     >
                       <input
                         type="text"
                         value={textBoxData[props.pageNumber]?.text || ""}
                         onChange={handleChangeText}
                         placeholder={modelInputText}
                       />
                     </div>
                   </Draggable>
                   </>
                  )}
                 


                </div>
              )
            )} */}


{/* {numPages &&
  Array.from({ length: numPages }, (_, index) => index + 1).map(
    (pageNumber) => (
      <div
        key={pageNumber}
        className="pdfPage"
        style={{ marginBottom: "20px", position: "relative" }}
      >
        <Page
          pageNumber={pageNumber}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />

        {
        pageNumber === textBoxData[pageNumber]?.pageNumber && (
          <Draggable
            axis="both"
            handle=".handle"
            position={{
              x: textBoxData[pageNumber]?.x || 0,
              y: textBoxData[pageNumber]?.y || 0,
            }}
            scale={1}
            onDrag={handleDrag}
            bounds=".pdfPage"
          >
            <div
              className="handle"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                color: "white",
                padding: "10px",
                cursor: "move",
              }}
            >
              <input
                type="text"
                // value={textBoxData[pageNumber]?.text || ""}
                onChange={handleChangeText}
                placeholder= {textBoxData[pageNumber]?.text || ""}
              />
            </div>
          </Draggable>
        )}
      </div>
    )
  )} */}

{numPages &&
  Array.from({ length: numPages }, (_, index) => index + 1).map(
    (pageNumber) => (
      <div key={pageNumber} className="pdfPage" style={{ marginBottom: "20px", position: "relative" }}>
        <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />

        {(textBoxData[pageNumber]?.length > 0) && textBoxData[pageNumber].map((tagData, index) => ( // Check if textBoxData[pageNumber] exists
                  <Draggable
                    key={index} // Use index as key for now (improve later if needed)
                    axis="both"
                    handle=".handle"
                    position={{ x: tagData.x, y: tagData.y }}
                    scale={1}
                    onDrag={(e, data) => { // Update drag handler
                      const updatedTags = [...textBoxData[pageNumber]];
                      updatedTags[index] = { ...tagData, x: data.x, y: data.y };
                      setTextBoxData(prev => ({ ...prev, [pageNumber]: updatedTags }));
                    }}
                    bounds=".pdfPage"
                  >
                    <div className="handle" style={{ position: "absolute", top: 0, left: 0, color: "white", padding: "10px", cursor: "move" }}>
                      <input
                        type="text"
                        value={tagData.text}
                        onChange={(e) => { // Update change handler
                          const updatedTags = [...textBoxData[pageNumber]];
                          updatedTags[index] = { ...tagData, text: e.target.value };
                          setTextBoxData(prev => ({ ...prev, [pageNumber]: updatedTags }));
                        }}
                        placeholder="Enter text here"
                      />
                    </div>
                  </Draggable>
                ))}
              </div>
            )
          )}
        </div>
        

      </Document>
      <button onClick={generateJSONFile} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Download JSON
      </button>
      

    </div>
  );
}

export default PdfScroll;

