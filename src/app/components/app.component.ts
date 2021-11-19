import { Component, EventEmitter, OnInit, Output, isDevMode, Input } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    @Output('startConfig') private _startConfig: EventEmitter<boolean> = new EventEmitter<boolean>();
    private _activeCategory: number = 0;

    public appVersion: string = environment.appVersion;
    public isDevMode: boolean = isDevMode();

    public isLoading: boolean = true;
    public headerImgPath: string = 'assets/images/web/';
    public headerImgs: Array<Array<string>> = [
        // Geburtstag
        [ 'type-2',
            'birthday/Canvas/peter-bucks-lGxtfJlYSmU-unsplash.jpg', 'birthday/Canvas/caju-gomes-QDq3YliZg48-unsplash.jpg', 'birthday/Canvas/quokkabottles-gkvsCKnxRc4-unsplash.jpg',
            'birthday/Canvas/miguel-teirlinck-WLlW03JZGBE-unsplash.jpg', 'birthday/Canvas/sara-cervera-zEwgRzJJIvk-unsplash.jpg', 'birthday/Canvas/designecologist--ufMDkBOwGY-unsplash.jpg',
            'birthday/Canvas/nathan-dumlao-As8zq82LBpw-unsplash.jpg' ],

        // Hochzeit
        [ 'type-3',
            'wedding/Canvas/marc-a-sporys-NO8Sj4dKE8k-unsplash.jpg', 'wedding/Canvas/kelly-sikkema-k3Us72bWWW0-unsplash.jpg', 'wedding/Canvas/leonardo-miranda-dvF6s1H1x68-unsplash.jpg',
            'wedding/Canvas/isaiah-rustad-e0QVpFvn_fE-unsplash.jpg', 'wedding/Canvas/ben-waardenburg-turMjjFKEBE-unsplash.jpg', 'wedding/Canvas/sandy-millar-8vaQKYnawHw-unsplash.jpg',
            'wedding/Canvas/olivia-bauso-30UOqDM5QW0-unsplash.jpg'],

        // Geburt
        [ 'type-1',
            'birth/Canvas/garrett-jackson-oOnJWBMlb5A-unsplash.jpg', 'birth/Canvas/kaushal-mishra-p76UivR30oo-unsplash.jpg', 'birth/Canvas/brytny-com-C4rXIFSzEXk-unsplash.jpg',
            'birth/Canvas/peter-oslanec-Mu6RjGUzrQA-unsplash.jpg', 'birth/Canvas/minnie-zhou-0hiUWSi7jvs-unsplash.jpg', 'birth/Canvas/fe-ngo-bvx3G7RkOts-unsplash.jpg',
            'birth/Canvas/colin-maynard-CEEhmAGpYzE-unsplash.jpg'],

        // Kommunion
        [ 'type-4',
            'communion/Canvas/iStock-1156416303.jpg', 'communion/Canvas/iStock-477859339.jpg', 'communion/Canvas/iStock-957298874.jpg', 'communion/Canvas/iStock-185064367.jpg',
            'communion/Canvas/iStock-506909031.jpg', 'communion/Canvas/iStock-649622342.jpg', 'communion/Canvas/iStock-501665150.jpg'],

        // Weihnachten
        [ 'type-5',
            'christmas/Canvas/jonathan-borba-vcX5AhBwk6s-unsplash.jpg', 'christmas/Canvas/dari-lli-fzZ-AY0WNVE-unsplash.jpg', 'christmas/Canvas/chris-benson-UWq1B5gpBIE-unsplash.jpg',
            'christmas/Canvas/jonathan-borba-P3Tc5ZxHowk-unsplash.jpg', 'christmas/Canvas/valentin-petkov-SJ9LXHONNv4-unsplash.jpg', 'christmas/Canvas/roberto-nickson-u6fDUe2x11g-unsplash.jpg',
            'christmas/Canvas/kate-hliznitsova-GWrjiKCiKw8-unsplash.jpg']
    ];

    public ngOnInit () : void {
        // this.doImgTransform(0);
    }

    public startConfig() {
        this._startConfig.emit(true);
    }

    public get activeCategory () : number {
        return this._activeCategory;
    }

    @Input('section')
    public set activeCategoryRoute ( value : number ) {
        this.isLoading = true;
        this._activeCategory = value;
        setTimeout( () => {
            this.isLoading = false;
        }, 1000 );

    }
    public set activeCategory ( value : number ) {

        if (this._activeCategory !== value) {
            this.doImgTransform(value);
        }
    }

    private doImgTransform( value: number ) {
        this.isLoading = true;
        setTimeout( () => {
            this._activeCategory = value;
            this.isLoading = false;
        }, 1000 );
    }
}
