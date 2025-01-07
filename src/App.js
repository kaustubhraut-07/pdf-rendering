import { useEffect, useState } from "react";

import { pdfjs } from "react-pdf";
import PdfComp from "./PdfComp";
import { Upload, notification, Button } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PdfScroll from "./pdfScroll";
import TestPdfScroll from "./Testpdfscroll.jsx";
import TestPdfScroll1 from "./Testpdfscroll1.jsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();




const { Dragger } = Upload;
function App() {
 

  

  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [textboxPosition, setTextboxPosition] = useState({ x: 0, y: 0 });

  
  const props = {
    name: "file",
    accept: ".pdf",
    maxCount: 1,
    onChange(info) {
      const file = info.fileList[0]?.originFileObj;

      if (file) {
        if (file.type !== "application/pdf") {
          notification.error({
            message: "Invalid File Type",
            description: "Only PDF files are allowed.",
          });
          return;
        }

        setPdfFile(URL.createObjectURL(file));
        setPageNumber(1); 
        // notification.success({
        //   message: "File Uploaded",
        //   description: "Your PDF file has been uploaded successfully.",
        // });
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const onDocumentLoadSuccessNumberOfPages = ( numPages ) => {
    setNumPages(numPages);
    console.log("Number of pages:in ap=p ", numPages);
  };
  


  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1,  page- 1));
    
  };


  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages, page + 1));
    
  };
  const handleScroll = (event) => {
    const { deltaY } = event;
    if (deltaY > 0) {
      setPageNumber((prevPage) => Math.min(numPages, prevPage + 1));
    } else {
      setPageNumber((prevPage) => Math.max(1, prevPage - 1));
    }
  };
  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
  };
 
  return (
    // <div className="App">

    <div className="App" onScroll={handleScroll}>
       <Dragger {...props} className="max-w-2xl p-6">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Upload a PDF file (max size 10 MB).
        </p>
      </Dragger>

    

      <div className="flex items-center space-x-4">
            <Button 
              onClick={goToPrevPage}
              // disabled={pageNumber <= 1}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center space-x-4">

             <Button
              onClick={goToNextPage}
              // disabled={pageNumber >= numPages}
              className="flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
            </div>


      {/* <PdfComp pdfFile={pdfFile} pageNumber = {pageNumber} onDocumentLoadSuccessNumberOfPages={onDocumentLoadSuccessNumberOfPages}/> */}
      
      
      {/* <PdfScroll pdfFile={pdfFile} pageNumber={pageNumber}
       onDocumentLoadSuccessNumberOfPages={onDocumentLoadSuccessNumberOfPages} 
       onPageChange={handlePageChange} 

      /> */}

      <TestPdfScroll
pdfFile={pdfFile} pageNumber={pageNumber}
onDocumentLoadSuccessNumberOfPages={onDocumentLoadSuccessNumberOfPages} 
onPageChange={handlePageChange} />


{/* <TestPdfScroll1
pdfFile={pdfFile} pageNumber={pageNumber}
onDocumentLoadSuccessNumberOfPages={onDocumentLoadSuccessNumberOfPages} 
onPageChange={handlePageChange} /> */}
      
    </div>
  );
}

export default App;



