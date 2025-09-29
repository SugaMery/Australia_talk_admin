import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userInfo: any;

  constructor(private userService: UserService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const user_id = localStorage.getItem('user_id');
    if (token && user_id) {
      this.userService.setToken(token);
      this.userService.getById(Number(user_id)).subscribe({
        next: (info) => this.userInfo = info,
        error: () => this.userInfo = null
      });
    }
  }
}
