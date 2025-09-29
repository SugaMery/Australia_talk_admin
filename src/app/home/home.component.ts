import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  userInfo: any;

  constructor(private userService: UserService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const user_id = localStorage.getItem('user_id');
    console.log('Token:', token);
    console.log('User ID:', user_id);
    if (token && user_id) {
      // Set the token in UserService before making the request
      this.userService.setToken(token);
      this.userService.getById(Number(user_id)).subscribe({
        next: (info) => {
          this.userInfo = info;
          console.log('User Info:', info);
        },
        error: (err) => {
          this.userInfo = null;
          console.error('Error fetching user info:', err);
        }
      });
    }
  }
}
