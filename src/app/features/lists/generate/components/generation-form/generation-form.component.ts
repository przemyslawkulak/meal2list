import { ChangeDetectionStrategy, Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CharacterCounterComponent } from '../character-counter/character-counter.component';

@Component({
  selector: 'app-generation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CharacterCounterComponent,
  ],
  templateUrl: './generation-form.component.html',
  styleUrls: ['./generation-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationFormComponent {
  generate = output<string>();
  contentChange = output<boolean>();

  initialRecipeText = input<string>('');
  disabled = input<boolean>(false);

  readonly form: FormGroup;
  readonly maxLength = 10000;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      recipeText: ['', [Validators.required, Validators.maxLength(this.maxLength)]],
    });

    effect(() => {
      const initialText = this.initialRecipeText();
      if (initialText && !this.form.get('recipeText')?.value) {
        this.form.patchValue({ recipeText: initialText });
      }
    });

    // Watch for form changes to emit contentChange
    effect(() => {
      const hasContent = !!this.form.get('recipeText')?.value?.trim();
      this.contentChange.emit(hasContent);
    });

    // Update form disabled state based on input
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const recipeText = this.form.get('recipeText')?.value;
      this.generate.emit(recipeText);
    }
  }

  get textLength(): number {
    return this.form.get('recipeText')?.value?.length || 0;
  }
}
