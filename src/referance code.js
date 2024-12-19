import React, { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import { InboxOutlined } from "@ant-design/icons";
import { Upload, Form, notification } from "antd";
import VideoForm from "./VideoForm";
import "./upload-form.css";
import moment from "moment";
import { useSelector } from "react-redux";

const { Dragger } = Upload;

const UploadVideo = ({ updateVideoData, videoData, next }) => {
  const [blobFile, setBlobFile] = React.useState(null);
  const [videoForm] = Form.useForm();
  const videoRef = useRef(null);
  const [newRenderWidth, setNewRenderWidth] = useState(null);
  let renderWidth, renderHeight, originalWidth, originalHeight;

  const textBoxRef = useRef(null);
  const [textboxPosition, setTextboxPosition] = useState({ x: 0, y: 0 });

  const { fontSize, font, color } = useSelector((state) => state.textStyle);

  const { video_file } = useSelector((state) => state.auth);

  useEffect(() => {
    if (videoData) {
      if (videoData.video_file) {
        if (!video_file) {
          setBlobFile(URL.createObjectURL(videoData?.video_file));
        }
        setTextStyle({
          ...textStyle,
          color: videoData.font_color,
        });
      }
    }
  }, [])

  useEffect(() => {
    if (video_file) {
      setBlobFile(video_file);
    }
  }, [video_file])

  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 600000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const [fontAdjustmentFactor, setFontAdjustmentFactor] = useState(1);

  function getVideoSize(callback) {
    const video = document.querySelector(".video-container video");
    if (video) {
      renderWidth = video.offsetWidth;
      renderHeight = video.clientHeight;
      originalWidth = video.videoWidth;
      originalHeight = video.videoHeight;

      const widthRatio = renderWidth / originalWidth;
      const heightRatio = renderHeight / originalHeight;
      const adjustmentFactor = Math.min(widthRatio, heightRatio);
      setFontAdjustmentFactor(adjustmentFactor);

      if (typeof callback === "function") {
        callback();
      }

      // const x = dragData.x * (originalWidth / renderWidth);

      // const y = dragData.y * (originalHeight / renderHeight);

      const prevx = (videoData.x * renderWidth) / originalWidth;
      const prevy = (videoData.y * renderHeight) / originalHeight;

      setTextboxPosition({ x: prevx, y: prevy });

      // setTextboxPosition({ x: videoData?.x , y: videoData?.y });
      setNewRenderWidth(renderWidth);
    }
  }

  useEffect(() => {
    getVideoSize();
  }, [blobFile]);

  const props = {
    name: "file",
    onChange(info) {
      const videoFile = info.fileList[0].originFileObj;

      // Check if the file size exceeds 100 MB (100 * 1024 * 1024 bytes)
      if (videoFile.size > 100 * 1024 * 1024) {
        notification.error({
          message: "File size is more than 100 MB",
          description: "Please upload a smaller video.",
        });
        return;
      }
      if (videoFile.type !== "video/mp4") {
        notification.error({
          message: "Invalid File Format",
          description: "Please upload a video in the .mp4 format.",
        });
        return;
      }

      const videoURL = URL.createObjectURL(videoFile);
      setBlobFile(videoURL);
      updateVideoData("video_file", videoFile);
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const [textStyle, setTextStyle] = useState({
    color: "#000000",
    fontSize: "10",
    font: "Arial",
    fontStyle: "normal",
  });

  // get the start and end time of video
  let endTime = null;
  const [formatEndTime, setformatEndTime] = useState("");
  const handleLoadedMetadata = () => {
    endTime = videoRef.current.duration;
    const duration = moment.duration(endTime, "seconds");
    setformatEndTime(moment.utc(duration.asMilliseconds()).format("HH:mm:ss"));
    getVideoSize();
  };

  const clickOntextbox = () => {
    document.getElementById("overlay-textbox")?.focus();
  };

  const handleDrag = (e, dragData) => {
    setTextboxPosition({ x: dragData.x, y: dragData.y });
    const video = document.querySelector(".video-container video");

    if (video) {
      renderWidth = video.offsetWidth;
      renderHeight = video.clientHeight;
      originalWidth = video.videoWidth;
      originalHeight = video.videoHeight;
    }

    const textareaWidth = textBoxRef.current.getBoundingClientRect().width * (originalWidth / renderWidth);

    const textareaHeight = textBoxRef.current.getBoundingClientRect().height * (originalHeight / renderHeight);
    const x = dragData.x * (originalWidth / renderWidth);

    const y = dragData.y * (originalHeight / renderHeight);
    updateVideoData("x", x)
    updateVideoData("y", y)
    updateVideoData("width_box", textareaWidth)
    updateVideoData("height_box", textareaHeight)
  };



  return (
    <>
      {blobFile === null ? (
        <Dragger
          {...props}
          style={{ maxWidth: "650px" }}
          previewFile={true}
          maxCount={1}
          accept=".mp4"
          rules={[{ required: true, message: "Please Upload Video!" }]}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibit from
            {window.screen.width >= 480 && <br />} uploading company data or
            other band files.
          </p>
        </Dragger>
      ) : (
        <>
          <div className="video-container" style={{ maxWidth: `${newRenderWidth}px` }}>
            <video
              className="uploaded-video"
              ref={videoRef}
              src={blobFile}
              style={{
                width: "35%",
                height: "35%",
              }}
              controls
              autoPlay
              onLoadedMetadata={handleLoadedMetadata}
              id="uploaded-video"
            />
            <Draggable
              onDrag={handleDrag}
              position={textboxPosition}
              bounds={"#uploaded-video"}
              onStop={clickOntextbox}
            >
              <p
                ref={textBoxRef}
                style={{
                  color: color,
                  fontSize: `${(fontSize) * fontAdjustmentFactor}px`,
                  fontFamily: font,
                  background: "transparent",
                  maxWidth: `${newRenderWidth}px`,

                  margin: "0"
                }}
                className="overlay-textbox"
                id="overlay-textbox"
              >
                Guest Name
              </p>
            </Draggable>
          </div>

          <VideoForm
            videoData={videoData}
            endvideoTime={formatEndTime}
            videoForm={videoForm}
            textStyle={textStyle}
            setTextStyle={setTextStyle}
            updateVideoData={updateVideoData}
            next={next}
            textBoxRef={textBoxRef}
          />
        </>
      )}
    </>
  );
};

export default UploadVideo;