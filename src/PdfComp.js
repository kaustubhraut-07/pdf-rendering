import React, { useEffect, useState, useRef } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";

function PdfComp(props) {
  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);
  const textBoxRef = useRef(null);
  const [textBoxData, setTextBoxData] = useState({});
  const [newRenderWidth, setNewRenderWidth] = useState(null); 

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    props.onDocumentLoadSuccessNumberOfPages(numPages);
  }

  function getPdfPageSize() {
    const pdfPage = document.querySelector(".pdfPage");
    if (pdfPage) {
      setNewRenderWidth(pdfPage.offsetWidth); 
    }
  }

  useEffect(() => {
    getPdfPageSize();
  }, []);

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

      // Ensure that any update to text or coordinates is saved to localStorage
      localStorage.setItem(`${props.pageNumber}`, JSON.stringify(updatedData[props.pageNumber]));

      return updatedData;
    });
  };

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
    link.download = 'dragger_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(tempUrl);
  };

  return (
    <div className="pdf-div">
      <p>
        Page {props.pageNumber} of {numPages}
      </p>
      <Document
        file={props.pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <div className="pdfPage" style={{ position: 'relative' }}>
          <Page
            pageNumber={props.pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
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
                // background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '10px',
                cursor: 'move'
              }}
            >
              <input
                type="text"
                value={textBoxData[props.pageNumber]?.text || ""}
                onChange={handleChangeText}
              />
            </div>
          </Draggable>
        </div>
      </Document>

      <button onClick={generateJSONFile} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Download JSON
      </button>
    </div>
  );
}

export default PdfComp;
