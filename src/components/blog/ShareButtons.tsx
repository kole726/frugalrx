"use client"
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  EmailIcon
} from 'react-share'

interface ShareButtonsProps {
  url: string
  title: string
  description: string
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const iconSize = 40
  const roundedClass = "rounded-lg overflow-hidden hover:opacity-80 transition-opacity"

  return (
    <div className="flex gap-3">
      <FacebookShareButton url={url} quote={title} className={roundedClass}>
        <FacebookIcon size={iconSize} />
      </FacebookShareButton>

      <TwitterShareButton url={url} title={title} className={roundedClass}>
        <TwitterIcon size={iconSize} />
      </TwitterShareButton>

      <LinkedinShareButton 
        url={url} 
        title={title}
        summary={description}
        source="FrugalRx"
        className={roundedClass}
      >
        <LinkedinIcon size={iconSize} />
      </LinkedinShareButton>

      <EmailShareButton
        url={url}
        subject={title}
        body={`Check out this article from FrugalRx: ${description}\n\n${url}`}
        className={roundedClass}
      >
        <EmailIcon size={iconSize} />
      </EmailShareButton>
    </div>
  )
} 