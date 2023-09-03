import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  /**
   * 
   * @param pages -> selcted pages -> example: 1,3-5,10
   * @param expairedDate -> expaire date in ISO string format
   * @returns has to be string -> url to something
   */
  login(pages: string, expairedDate: string) {
    const yourObject = {
      firstParam: pages,
      secondParam: expairedDate,
      something: "...."
    };

    // get yout url somehow
    const link = this.httpClient.post(
      "your url to BE",
      yourObject
    );

    return link;
  }
}
