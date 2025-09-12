package types

import "time"

type ExchangeEmailData struct {
	MessageID     string            `json:"message_id"`
	Subject       string            `json:"subject"`
	From          string            `json:"from"`
	FromName      string            `json:"from_name"`
	Date          time.Time         `json:"date"`
	Body          string            `json:"body"`
	BodyHTML      string            `json:"body_html"`
	Folder        string            `json:"folder"`
	Attachments   []AttachmentInfo  `json:"attachments"`
	Headers       map[string]string `json:"headers"`
}

type AttachmentInfo struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
	Type string `json:"type"`
}

type GmailEmailData struct {
	MessageID     string            `json:"message_id"`
	Subject       string            `json:"subject"`
	From          string            `json:"from"`
	FromName      string            `json:"from_name"`
	Date          time.Time         `json:"date"`
	Body          string            `json:"body"`
	BodyHTML      string            `json:"body_html"`
	Folder        string            `json:"folder"`
	Attachments   []AttachmentInfo  `json:"attachments"`
	Headers       map[string]string `json:"headers"`
}