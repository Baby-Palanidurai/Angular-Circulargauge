import { NoticePriority } from 'app/shared/global/enum';

export class Notice {
  subject: string;
  priority: NoticePriority;
  text: string;

  constructor(subject: string, priority: NoticePriority, text: string) {
    this.subject = subject;
    this.priority = priority;
    this.text = text;
  }
}

export class NoticePriorityItem {
  priority: NoticePriority;
  text: string;

  constructor(priority: NoticePriority, text: string) {
    this.priority = priority;
    this.text = text;
  }
}

