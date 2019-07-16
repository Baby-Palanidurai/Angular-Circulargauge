import {AngularcliSetupPage} from './app.po';

describe('angularcli-setup App', () => {
    let page: AngularcliSetupPage;

    beforeEach(() => {
        page = new AngularcliSetupPage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toContain('app works!');
        expect(page.getParagraphText()).toContain('Success Message');
    });
});
