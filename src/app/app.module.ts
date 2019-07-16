import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// Syncfusion ej2 module's
import { ButtonModule, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DialogModule, TooltipAllModule } from '@syncfusion/ej2-angular-popups';
import { ToastModule } from '@syncfusion/ej2-angular-notifications';
import { SidebarModule, TreeViewModule, ContextMenuModule, TabModule } from '@syncfusion/ej2-angular-navigations';
import { ListViewModule, VirtualizationService } from '@syncfusion/ej2-angular-lists';
import { GridModule, PageService, SortService, ContextMenuService, ResizeService, SelectionService } from '@syncfusion/ej2-angular-grids';
import { CircularGaugeModule, GaugeTooltipService, AnnotationsService } from '@syncfusion/ej2-angular-circulargauge';
import { SplitterModule } from '@syncfusion/ej2-angular-layouts';
import { PipesModule } from '@syncfusion/ej2-angular-pipes'; // used for grid and deep-watch !

import { SessionService } from './shared/sessions/session.service';
import { ObjectService } from './shared/objects/object.service';
import { TextService } from './shared/texts/text.service';
import { TimerService } from './shared/timers/timer.service';
import { EventService } from './shared/events/event.service';
import { LicenseService } from './shared/license/license.service';
import { ConfigService } from './shared/config/config.service';
import { OauthService } from './shared/oauth/oauth.service';
import { Global } from './shared/global/global';
import { UpdateService } from './shared/update/update.service';

import { AppComponent } from './app.component';
import { FooterComponent } from './components/footer/footer.component';
import { OvNavComponent } from './components/ov-nav/ov-nav.component';
import { MainNavComponent } from './components/main-nav/main-nav.component';
import { OvComponent } from './components/ov/ov.component';
import { HomeComponent } from './components/home/home.component';
import { ObjectBoxNavComponent } from './components/object-box-nav/object-box-nav.component';
import { ObjectBoxComponent } from './components/object-box/object-box.component';

import { SimpleTimer } from 'ng2-simple-timer';
import { OdbInfoComponent } from './components/odb-info/odb-info.component';
import { EvComponent } from './components/ev/ev.component';
import { EvNavComponent } from './components/ev-nav/ev-nav.component';
import { NoticeEditComponent } from './components/notice-edit/notice-edit.component';

import { NgIdleModule } from '@ng-idle/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './shared/oauth/token.interceptor';

import { CookieService } from 'ngx-cookie-service';

import { DeviceDetectorModule } from 'ngx-device-detector';
import { RoutingData } from './shared/routing/routing-data';
import { ObjSingleTreeComponent } from './components/obj-single-tree/obj-single-tree.component';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'ov',
        component: OvComponent,
    },
    {
        path: 'ev',
        component: EvComponent
    },
    {
        path: 'object-box/:objTag',
        component: ObjectBoxComponent,
    },
    {
        path: '**',
        redirectTo: 'home',
        pathMatch: 'full'
    }, // muss am Schluß stehen!!!
];

@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        OvNavComponent,
        MainNavComponent,
        ObjectBoxNavComponent,
        OvComponent,
        HomeComponent,
        OdbInfoComponent,
        EvComponent,
        EvNavComponent,
        NoticeEditComponent,
        ObjectBoxComponent,
        ObjSingleTreeComponent,
    ],
    imports: [
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes, { useHash: true }),
        FormsModule,
        HttpClientModule,
        NgIdleModule.forRoot(),
        DeviceDetectorModule.forRoot(),
        // Registering EJ2 module's
        ButtonModule,
        SwitchModule,
        DropDownListModule,
        SidebarModule,
        TreeViewModule,
        ToastModule,
        DialogModule,
        ListViewModule,
        GridModule,
        ContextMenuModule,
        TabModule,
        CircularGaugeModule,
        TooltipAllModule,
        SplitterModule,
        PipesModule,
    ],
    providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: TokenInterceptor,
        multi: true,
    },
        SimpleTimer, Global, TimerService, SessionService, ObjectService, TextService, EventService, LicenseService, ConfigService,
        FooterComponent, OdbInfoComponent, OauthService, UpdateService, CookieService, VirtualizationService, PageService, SortService,
        ContextMenuService, ResizeService, SelectionService, GaugeTooltipService, AnnotationsService, RoutingData],
    bootstrap: [AppComponent]
})
export class AppModule {
}
