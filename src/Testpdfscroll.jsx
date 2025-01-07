import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";
import CustomModal from "./Modal"; 
import { Button ,notification,Upload} from "antd";
import { DeleteOutlined,InboxOutlined } from "@ant-design/icons";
import axios from "axios";

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

const[csvFile , setcsvFile ]  = useState();


  const { Dragger } = Upload;
  const draggerprops = {
    name: "file",
    accept: ".csv",
    maxCount: 1,
    onChange(info) {
      const file = info.fileList[0]?.originFileObj;
  
      if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension !== "csv") {
          notification.error({
            message: "Invalid File Type",
            description: "Only CSV files are allowed.",
          });
          return;
        }
        setcsvFile(file);
        // setPdfFile(URL.createObjectURL(file));
        // setPageNumber(1);
        // notification.success({
        //   message: "File Uploaded",
        //   description: "Your csv file has been uploaded successfully.",
        // });
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };


console.log("csv file", csvFile);

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
    // const tempUrl = URL.createObjectURL(fileData);

    // const link = document.createElement('a');
    // link.href = tempUrl;
    // link.download = 'scroll_data.json';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // URL.revokeObjectURL(tempUrl);
    return fileData;
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

  const handleRemoveInputTag = ()=>{
    console.log("remove tag",textBoxData[currentVisiblePage]);

    setTagCount(tagCount - 1);
    setTextBoxData(prevData => {
      const updatedPageData = [...(prevData[currentVisiblePage] || [])];
      updatedPageData.pop();
      return { ...prevData, [currentVisiblePage]: updatedPageData };
    });



  }
  console.log(tagCount , "tag count");

  const handleGeneratePdf = async() => {
    try {
      const jsonData = generateJSONFile();
      console.log("jsonData" ,  jsonData);
      const pdffile =  await fetch(props.pdfFile).then(r => r.blob()); /// converting to blog again from url
      const formData = new FormData();
      formData.append('pdf_file', pdffile);
      formData.append('csv_file', csvFile);
      // formData.append('json_file', jsonData);
      // const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
      formData.append('json_file', jsonData, 'data.json');
      console.log(props.pdfFile, csvFile, jsonData);
      console.log("formData", formData.values());
      const res = await axios.post(process.env.REACT_APP_API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }});
      console.log("res", res);
    } catch (error) {

        console.log("error", error);
    }
  }

  return (
    <div className="pdf-div">

      <Dragger {...draggerprops} className="max-w-2xl p-6" >
      <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Upload a csv file (max size 10 MB).
        </p>
      </Dragger>




      <p>
        Page {currentVisiblePage} of {numPages}
      </p>
      <div>
        <Button type="primary" onClick={handleAddTageincurrentPage}>Add Tag</Button>
      </div>
  
      {/* {isModalOpen && <CustomModal isOpen={isModalOpen} onClose={handleCloseModal} onAddTextbox={handleAddTextbox} onPageNo={handleModalPageNo} />} */}

      <Document file={props.pdfFile} onLoadSuccess={onDocumentLoadSuccess}  > 
        <div ref={scrollContainerRef} className="pdfPagesContainer" style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: '100vh',width:"100%", overflow : 'auto' }}> 
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
                    
                    // bounds= {{
                    //   left: 0,
                    //   top: 0,
                    //   right: pageDimensions[pageNumber]?.width - 185 || 0,
                    //   bottom: pageDimensions[pageNumber]?.height - 26 || 0,
                    // }}

                    bounds={{
                      left: 0, // Allow movement to the left beyond 0
                      top: 0,
                      right: pageDimensions[pageNumber]?.width - 52 || 0, //tagData.width 
                      bottom: pageDimensions[pageNumber]?.height - 26 || 0, // tagData.height
                    }}
                    onDrag={(e, data) => updateTextBoxData(pageNumber, index, { x: data.x, y: data.y })}
                    // bounds=".pdfPage"
                    // bounds="parent"
                    
                  >
                 
                    <div className="handle" style={{ position: "absolute",
                     top: 0, left: 0, 
                     margin: "0px", padding: "0px",
                     color: "white", cursor: "move" , 
                    // border : "1px solid black"
                    border : "1px solid white",
                    overflow:'auto',
                    // zIndex:1000
                    // cursor:"drag",
                    

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
                          color:"white",
                          margin: "0px",
                          padding: "0px",
                          width: `${tagData.width || tagData.text.length * 10}px`, 
                          height: `${tagData.height || 20}px`,
                         
                          
                        }}
                        
                      />
                      <div style={{cursor:"pointer" , display:"inline-block"}} onClick={handleRemoveInputTag}>
                      <DeleteOutlined />
                      </div>
                    </div>
                  </Draggable>
                  </>
                ))}
              </div>
            
            ))}
        </div>
      </Document>
      {/* <button onClick={generateJSONFile} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Download JSON
      </button> */}

      <button onClick={handleGeneratePdf} style={{ margin: '10px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Generate PDF
      </button>
    </div>
  );
}

export default TestPdfScroll;