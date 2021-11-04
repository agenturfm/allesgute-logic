import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    public isLoading: boolean = true;
    public headerImgPath: string = 'assets/images/web/';
    public headerImgs: Array<Array<string>> = [
        // Geburtstag
        [ 'birthday/Canvas/peter-bucks-lGxtfJlYSmU-unsplash.png', 'birthday/Canvas/caju-gomes-QDq3YliZg48-unsplash.png', 'birthday/Canvas/quokkabottles-gkvsCKnxRc4-unsplash.png',
            'birthday/Canvas/miguel-teirlinck-WLlW03JZGBE-unsplash.png', 'birthday/Canvas/sara-cervera-zEwgRzJJIvk-unsplash.png', 'birthday/Canvas/designecologist--ufMDkBOwGY-unsplash.png',
            'birthday/Canvas/nathan-dumlao-As8zq82LBpw-unsplash.png' ],

        // Hochzeit
        [ 'wedding/Canvas/marc-a-sporys-NO8Sj4dKE8k-unsplash.png', 'wedding/Canvas/kelly-sikkema-k3Us72bWWW0-unsplash.png', 'wedding/Canvas/leonardo-miranda-dvF6s1H1x68-unsplash.png',
            'wedding/Canvas/isaiah-rustad-e0QVpFvn_fE-unsplash.png', 'wedding/Canvas/ben-waardenburg-turMjjFKEBE-unsplash.png', 'wedding/Canvas/sandy-millar-8vaQKYnawHw-unsplash.png',
            'wedding/Canvas/olivia-bauso-30UOqDM5QW0-unsplash.png'],

        // Geburt
        [ 'birth/Canvas/garrett-jackson-oOnJWBMlb5A-unsplash.png', 'birth/Canvas/kaushal-mishra-p76UivR30oo-unsplash.png', 'birth/Canvas/brytny-com-C4rXIFSzEXk-unsplash.png',
            'birth/Canvas/peter-oslanec-Mu6RjGUzrQA-unsplash.png', 'birth/Canvas/minnie-zhou-0hiUWSi7jvs-unsplash.png', 'birth/Canvas/fe-ngo-bvx3G7RkOts-unsplash.png',
            'birth/Canvas/colin-maynard-CEEhmAGpYzE-unsplash.png'],

        // Kommunion
        [ 'communion/Canvas/iStock-1156416303.jpg', 'communion/Canvas/iStock-477859339.jpg', 'communion/Canvas/iStock-957298874.jpg', 'communion/Canvas/iStock-185064367.jpg',
            'communion/Canvas/iStock-506909031.jpg', 'communion/Canvas/iStock-649622342.jpg', 'communion/Canvas/iStock-501665150.jpg'],

        // Weihnachten
        [ 'christmas/Canvas/jonathan-borba-vcX5AhBwk6s-unsplash.png', 'christmas/Canvas/dari-lli-fzZ-AY0WNVE-unsplash.png', 'christmas/Canvas/chris-benson-UWq1B5gpBIE-unsplash.png',
            'christmas/Canvas/jonathan-borba-P3Tc5ZxHowk-unsplash.png', 'christmas/Canvas/valentin-petkov-SJ9LXHONNv4-unsplash.png', 'christmas/Canvas/roberto-nickson-u6fDUe2x11g-unsplash.png',
            'christmas/Canvas/kate-hliznitsova-GWrjiKCiKw8-unsplash.png']
    ];

    private _activeCategory: number = 0;

    public ngOnInit () : void {
        this.doImgTransform(0);
    }

    public get activeCategory () : number {
        return this._activeCategory;
    }

    public set activeCategory ( value : number ) {

        console.log( 'new value', value );
        if (this._activeCategory !== value ) {
            this.doImgTransform(value);
        }
    }

    private doImgTransform( value: number ) {
        this.isLoading = true;
        setTimeout( () => {
            this._activeCategory = value;
            this.isLoading = false;
        }, 1000 );
        // //loading bar
        // $('.hero-section .loading-bar').css('width', 80 + '%');
    }
}
