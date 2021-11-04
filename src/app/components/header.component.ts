import { Component, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-header',
    template: `
        <!--HEADER-->
        <header id="site-header">
            <div class="container">
                <div class="nav-wrapper">
                    <div class="logo">
                        <a href="">Allesgute.info</a>
                    </div>
                    <nav>
                        <ul>
                            <li><a style="cursor: pointer" (click)="category=0">Geburtstag</a></li>
                            <li><a style="cursor: pointer" (click)="category=1">Hochzeit</a></li>
                            <li><a style="cursor: pointer" (click)="category=2">Geburt</a></li>
                            <li><a style="cursor: pointer" (click)="category=3">Kommunion</a></li>
                            <li><a style="cursor: pointer" (click)="category=4">Weihnachten</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
        <!--End of HEADER-->`
})
export class HeaderComponent {
    @Output() public activeCategory: EventEmitter<number> = new EventEmitter<number>();

    public set category (value: number) {
        this.activeCategory.emit(value);
    }
}
