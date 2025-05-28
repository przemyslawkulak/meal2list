import { ChangeDetectionStrategy, Component, input, output, effect } from '@angular/core';
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
  generate = output<{ listId: string; recipeText: string }>();
  shoppingLists = input.required<ShoppingListResponseDto[]>();
  initialRecipeText = input<string>('');

  readonly form: FormGroup;
  readonly maxLength = 5000;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      listId: ['', Validators.required],
      recipeText: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
    });

    effect(() => {
      const lists = this.shoppingLists();
      if (lists.length > 0 && !this.form.get('listId')?.value) {
        this.form.patchValue({ listId: lists[0].id });
      }
    });

    effect(() => {
      const initialText = this.initialRecipeText();
      if (initialText && !this.form.get('recipeText')?.value) {
        this.form.patchValue({ recipeText: initialText });
      }
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
