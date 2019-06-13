import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: '[app-header]',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  @Input('parrotCount') parrotCount: Observable<number>;

  constructor() { }

  ngOnInit() {
  }

}
