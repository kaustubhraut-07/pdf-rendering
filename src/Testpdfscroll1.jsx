import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import Draggable from "react-draggable";
import CustomModal from "./Modal";
import { Button, Upload } from "antd";
import Papa from "papaparse";

function TestPdfScroll1(props) {
  const [numPages, setNumPages] = useState(null);
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1);
  const [textBoxData, setTextBoxData] = useState({});
  const scrollContainerRef = useRef(null);
  const [modelInputText, setModalInputText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelPageNo, setModalPageNo] = useState([]);
  const [pageDimensions, setPageDimensions] = useState({});
  const [tagCount, setTagCount] = useState(0);
  const [csvData, setCsvData] = useState([]);

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

  const handleCsvUpload = (file) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setCsvData(results.data);
      },
      error: (error) => {
        console.error(error);
      },
    });
  };

  const generatePDFs = async () => {
    const { PDFDocument, rgb } = await import('pdf-lib');
    let pdfBytes;

    if (props.pdfFile instanceof File) {
      pdfBytes = await props.pdfFile.arrayBuffer();
    } else if (typeof props.pdfFile === 'string') {
      const response = await fetch(props.pdfFile);
      const blob = await response.blob();
      pdfBytes = await blob.arrayBuffer();
    } else {
      throw new Error('Unsupported pdfFile type');
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);

    for (const row of csvData) {
      const pagesToInclude = row.pageNumbers && typeof row.pageNumbers === 'string'
        ? row.pageNumbers.split(',').map(Number)
        : Array.from({ length: numPages }, (_, i) => i + 1);
      const newPdfDoc = await PDFDocument.create();

      for (const pageNumber of pagesToInclude) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
        newPdfDoc.addPage(copiedPage);

        if (textBoxData[pageNumber]) {
          for (const tagData of textBoxData[pageNumber]) {
            const tagValue = row[tagData.text];
            if (tagValue) {
              copiedPage.drawText(tagValue, {
                x: tagData.x,
                y: copiedPage.getHeight() - tagData.y,
                size: 16,
                color: rgb(0, 0, 0),
              });
            }
          }
        }
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `output_${row.id || 'unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
      <Upload beforeUpload={handleCsvUpload} accept=".csv">
        <Button>Upload CSV</Button>
      </Upload>
      <Document file={props.pdfFile} onLoadSuccess={onDocumentLoadSuccess} >
        <div ref={scrollContainerRef} className="pdfPagesContainer" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100vh', width: "80%", overflow: 'auto' }}>
          {numPages &&
            Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
              <div key={pageNumber} className="pdfPage" style={{ position: "relative" }}>
                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false}
                  width={595} // Width in points
                  height={841} // height in points
                  onLoadSuccess={(page) => handlePageLoadSuccess(page, pageNumber)}
                />
                {textBoxData[pageNumber]?.map((tagData, index) => (
                  <Draggable
                    key={`${pageNumber}-${index}`}
                    axis="both"
                    handle=".handle"
                    position={{ x: tagData.x, y: tagData.y }}
                    scale={1}
                    bounds={{
                      left: 0,
                      top: 0,
                      right: pageDimensions[pageNumber]?.width - 185 || 0,
                      bottom: pageDimensions[pageNumber]?.height - 26 || 0,
                    }}
                    onDrag={(e, data) => updateTextBoxData(pageNumber, index, { x: data.x, y: data.y })}
                  >
                    <div className="handle" style={{ position: "absolute", top: 0, left: 0, color: "white", cursor: "move", border: "1px solid white", overflow: 'auto' }}>
                      <input
                        type="text"
                        value={tagData.text}
                        onChange={(e) => updateTextBoxData(pageNumber, index, { text: e.target.value })}
                        readOnly
                        style={{ background: "transparent", border: "none", outline: "none", color: "white" }}
                      />
                    </div>
                  </Draggable>
                ))}
              </div>
            ))}
        </div>
      </Document>
      <button onClick={generatePDFs} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Generate PDFs
      </button>
    </div>
  );
}

export default TestPdfScroll1;
