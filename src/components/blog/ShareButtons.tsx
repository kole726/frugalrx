"use client"
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  EmailIcon,
  FacebookShareButtonProps,
  TwitterShareButtonProps,
  LinkedinShareButtonProps,
  EmailShareButtonProps
} from 'react-share'

interface ShareButtonsProps {
  url: string
  title: string
  description: string
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const iconSize = 32
  const roundedClass = "rounded-full overflow-hidden hover:opacity-80 transition-opacity"

  const facebookProps: FacebookShareButtonProps = {
    url,
    hashtag: "#FrugalRx",
    className: roundedClass
  }

  const twitterProps: TwitterShareButtonProps = {
    url,
    title,
    className: roundedClass
  }

  const linkedinProps: LinkedinShareButtonProps = {
    url,
    title,
    summary: description,
    className: roundedClass
  }

  const emailProps: EmailShareButtonProps = {
    url,
    subject: title,
    body: description,
    className: roundedClass
  }

  return (
    <div className="flex gap-3">
      <FacebookShareButton {...facebookProps}>
        <FacebookIcon size={iconSize} />
      </FacebookShareButton>

      <TwitterShareButton {...twitterProps}>
        <TwitterIcon size={iconSize} />
      </TwitterShareButton>

      <LinkedinShareButton {...linkedinProps}>
        <LinkedinIcon size={iconSize} />
      </LinkedinShareButton>

      <EmailShareButton {...emailProps}>
        <EmailIcon size={iconSize} />
      </EmailShareButton>
    </div>
  )
} 