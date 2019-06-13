import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Observable, timer } from 'rxjs';
import { switchMap, repeat, retry } from 'rxjs/operators';
import { v4 as Uuidv4 } from 'uuid';

import { Message } from "../models/message.model";
import { User } from '../models/user.model';

const apiRoot = 'https://tagchatter.herokuapp.com';
@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss']
})
export class ChatroomComponent implements OnInit {

  // Elemento que lista as mensagens
  @ViewChild('messageList', { static: true }) messageListCmp: ElementRef;

  // Observable que faz a requisição dos dados do usuário
  readonly currentUser$: Observable<User> = this.http.get<User>(`${apiRoot}/me`);

  // Observable que faz a requisição das mensagens
  readonly messages$ = timer(0, 3000).pipe(
    switchMap(() => this.http.get(`${apiRoot}/messages`)),
    repeat(),
    retry()
  );

  // Observable que faz a requisição da contagem de mensagens com parrot
  readonly parrotCount$ = timer(0, 3000).pipe(
    switchMap(() => this.http.get(`${apiRoot}/messages/parrots-count`)),
    repeat(),
    retry()
  );

  // Objeto contendo os dados do usuário
  currentUser: User;

  // Vetor contendo mensagens retornadas pelo back-end
  messages: Message[];

  // Atributo contendo contagem de mensagens com parrot
  parrotCount: number;

  // Vetor contendo mensagens cujos envios falharam
  unsentMessages: Message[] = [];

  messageForm = new FormGroup({
    message: new FormControl('', [Validators.required, Validators.minLength(3)])
  })

  constructor(private http: HttpClient) { }

  // Método que marca/desmarca mensagens
  onToggledParrot(message: { messageId: String, has_parrot: boolean }) {
    const msgIdx = this.messages.findIndex(msg => msg.id === message.messageId);
    const modifiedMessages = [...this.messages];
    modifiedMessages[msgIdx].has_parrot = !message.has_parrot;
    this.messages = modifiedMessages;

    if (!message.has_parrot) {
      // Faz um request para desmarcar a mensagem como parrot no servidor e incrementa contador
      this.parrotCount += 1;
      this.http.put(`${apiRoot}/messages/${message.messageId}/parrot`, {}).subscribe();
    } else {
      // Faz um request para desmarcar a mensagem como parrot no servidor e decrementa contador
      this.parrotCount -= 1;
      this.http.put(`${apiRoot}/messages/${message.messageId}/unparrot`, {}).subscribe();
    }
  }

  sendMessage() {
    // Manda a mensagem para a API quando o usuário envia a mensagem
    // Caso o request falhe exibe uma mensagem para o usuário utilizando Window.alert ou outro componente visual
    // Se o request for bem sucedido, atualiza o conteúdo da lista de mensagens
    if (this.messageForm.valid) {
      const fakeId = Uuidv4();
      const newMessage: Message = {
        author: { avatar: this.currentUser.avatar, name: this.currentUser.name, id: this.currentUser.id },
        content: this.messageForm.value.message,
        has_parrot: false,
        created_at: new Date().toISOString(),
        id: fakeId
      };

      // Atualização otimista
      this.messages = [...this.messages, newMessage];

      this.http.post(`${apiRoot}/messages`, { message: newMessage.content, author_id: newMessage.author.id })
        .subscribe(
          () => { },
          () => {
            this.messages = [...this.messages].filter(message => message.id !== newMessage.id);
            this.unsentMessages.push(newMessage);
          }
        );

      this.messageForm.setValue({ message: '' });

      setTimeout(() => {
        const msgList = this.messageListCmp.nativeElement;
        msgList.scrollTop = msgList.scrollHeight;
      }, 150);
    }
  }

  deleteUnsent(index: number) {
    this.unsentMessages.splice(index, 1);
  }

  sendUnsent(index: number) {
    const unsentMessage = this.unsentMessages[index];
    this.unsentMessages.splice(index, 1);
    this.http.post(`${apiRoot}/messages`, { message: unsentMessage.content, author_id: unsentMessage.author.id }).subscribe(
      () => { },
      () => {
        this.messages = [...this.messages].filter(message => message.id !== unsentMessage.id);
        this.unsentMessages.push(unsentMessage);
      }
    );

    // Atualização otimista
    this.messages = [...this.messages, unsentMessage];

    setTimeout(() => {
      const msgList = this.messageListCmp.nativeElement;
      msgList.scrollTop = msgList.scrollHeight;
    }, 150);

  }

  scrollDown() {
    const msgList = this.messageListCmp.nativeElement;
    msgList.scrollTop = msgList.scrollHeight;
  }

  ngOnInit() {
    this.messages$.subscribe((res: Message[]) => this.messages = res);
    this.parrotCount$.subscribe((res: number) => this.parrotCount = res);
    this.currentUser$.subscribe((res: User) => this.currentUser = res);
  }
}
