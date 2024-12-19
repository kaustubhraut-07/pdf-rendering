import React, { useState } from 'react';
import { Button, Modal, Input } from 'antd';
const CustomModal = ({ isOpen, onClose, onAddTextbox , onPageNo }) => {
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalPageNo , setModalPageNo] = useState()
  const showModal = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setModalText('');
    setConfirmLoading(true);
    setTimeout(() => {
      onAddTextbox(modalText);
      onPageNo(modalPageNo)

      setOpen(false);
      setConfirmLoading(false);
      onClose();
    }, 2000);
    // onClose();
  };
  const handleCancel = () => {
    console.log('Clicked cancel button');
    // setOpen(false);
    onClose();
  };

  const handleModalTextChange = (e) => {
    setModalText(e.target.value);
  };
  const handleModalPageNoChange = (e) => {
    setModalPageNo(e.target.value);
  };

  return (
    <>
      {/* <Button type="primary" onClick={showModal}>
        Open Modal
      </Button> */}
      <Modal
        title="Title"
        open={isOpen}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <Input type="text" required={true} value={modalPageNo} onChange={handleModalPageNoChange} placeholder="Enter Page No" />
       <Input type="text" required={true} value={modalText} onChange={handleModalTextChange} placeholder="Enter Placeholder name" />
      </Modal>
    </>
  );
};
export default CustomModal;