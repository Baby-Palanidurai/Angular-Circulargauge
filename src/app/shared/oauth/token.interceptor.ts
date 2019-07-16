import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { OauthService } from 'app/shared/oauth/oauth.service';
import { Observable } from 'rxjs';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const auth = this.injector.get(OauthService);

    request = request.clone({
      setHeaders: {
        Authorization: 'Bearer ' + auth.getToken(),
        'Content-Type': 'application/json',
      }
    });
    return next.handle(request);
  }
}
