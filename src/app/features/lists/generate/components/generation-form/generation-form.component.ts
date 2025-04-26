import { ChangeDetectionStrategy, Component, Output, EventEmitter, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CharacterCounterComponent } from '../character-counter/character-counter.component';
import { ShoppingListResponseDto } from '../../../../../../types';

@Component({
  selector: 'app-generation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    CharacterCounterComponent,
  ],
  templateUrl: './generation-form.component.html',
  styleUrls: ['./generation-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationFormComponent {
  @Output() generate = new EventEmitter<{ listId: string; recipeText: string }>();
  shoppingLists = input.required<ShoppingListResponseDto[]>();

  readonly form: FormGroup;
  readonly maxLength = 5000;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      listId: ['', Validators.required],
      recipeText: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.generate.emit(this.form.value);
    }
  }

  get textLength(): number {
    return this.form.get('recipeText')?.value?.length || 0;
  }
}
