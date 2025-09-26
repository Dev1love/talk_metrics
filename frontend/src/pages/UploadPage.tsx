import React from 'react'
import ChatUpload from '../components/upload/ChatUpload'

const UploadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-6">
      <div className="container mx-auto px-4">
        <ChatUpload />
      </div>
    </div>
  )
}

export default UploadPage