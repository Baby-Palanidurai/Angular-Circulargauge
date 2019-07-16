import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable()
export class UpdateService {

  constructor(private swUpdate: SwUpdate) {
  }

  public checkForUpdates() {
    if (this.swUpdate.isEnabled) {
      // alert('swUpdate enabled');
      this.swUpdate.available.subscribe(event => {
        const msg = 'Eine neue Version dieser App ist verfügbar. Aktualisieren?';

        if (confirm(msg)) {
          window.location.reload();
        }
      });
    }
  }

}
