import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faWineGlass,
  faKitMedical,
  faUtensils,
  faPaw,
  faHouse,
  faChild,
  faTv,
  faSoap,
  faBoxesStacked,
  faMugHot,
  faJar,
  faDrumstickBite,
  faSnowflake,
  faEgg,
  faCarrot,
  faPen,
  faCakeCandles,
  faBreadSlice,
  faPepperHot,
  faFish,
  faCandyCane,
  faBoxOpen,
  faSprayCanSparkles,
  faShirt,
  faLeaf,
  faGlassWater,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [FontAwesomeModule],
  template: '<fa-icon [icon]="icon()"></fa-icon>',
})
export class CategoryIconComponent {
  categoryName = input.required<string>();

  private readonly iconMap = new Map<string, IconDefinition>([
    ['Alcohol', faWineGlass],
    ['Baking', faCakeCandles],
    ['Bread', faBreadSlice],
    ['Canned Food', faJar],
    ['Child', faChild],
    ['Cleaning', faSprayCanSparkles],
    ['Clothing', faShirt],
    ['Coffee & Tea', faMugHot],
    ['Dairy & Eggs', faEgg],
    ['Dry Goods', faBoxOpen],
    ['Electronics', faTv],
    ['First Aid', faKitMedical],
    ['Fish & Seafood', faFish],
    ['For Pets', faPaw],
    ['Frozen', faSnowflake],
    ['Fruits & Vegetables', faCarrot],
    ['Home & Garden', faHouse],
    ['Hygiene', faSoap],
    ['Meat', faDrumstickBite],
    ['Other', faBoxesStacked],
    ['Others', faBoxesStacked],
    ['Ready Meals', faUtensils],
    ['Snacks & Sweets', faCandyCane],
    ['Spices & Oils', faPepperHot],
    ['Stationery', faPen],
    ['Vegan', faLeaf],
    ['Water & Beverages', faGlassWater],
  ]);

  readonly icon = computed(() => {
    return this.iconMap.get(this.categoryName()) || faBoxesStacked;
  });
}
