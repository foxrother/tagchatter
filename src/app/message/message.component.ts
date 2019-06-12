import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from "../models/message.model";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent {

  @Input('message') message: Message;
  @Output() toggledParrot = new EventEmitter<{ messageId: String, has_parrot: boolean }>();

  constructor() { }

  toggleParrot() {
    const has_parrot = this.message.has_parrot;
    this.toggledParrot.emit({ messageId: this.message.id, has_parrot: has_parrot });
  }

}
