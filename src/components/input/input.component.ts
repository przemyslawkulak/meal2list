import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule, MatFormFieldAppearance } from '@angular/material/form-field';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [
  //   {
  //     provide: NG_VALUE_ACCESSOR,
  //     useExisting: forwardRef(() => InputComponent),
  //     multi: true
  //   }
  // ]
})
export class InputComponent /* implements ControlValueAccessor */ {
  // Note: Implementing ControlValueAccessor is common for custom form controls,
  // but for simple wrappers, passing the FormControl directly via @Input might be simpler.
  // Choose the approach based on your needs. For now, we use direct FormControl binding.

  control = input.required<FormControl>();
  label = input('');
  placeholder = input('');
  type = input<string>('text');
  appearance = input<MatFormFieldAppearance>('outline');
  color = input<ThemePalette>('primary');
  hint = input('');
  required = input(false);
  readonly = input(false);

  // Implementation for ControlValueAccessor (if needed)
  // onChange: any = () => {};
  // onTouched: any = () => {};

  // writeValue(value: any): void {
  //   // Update internal state if necessary
  // }

  // registerOnChange(fn: any): void {
  //   this.onChange = fn;
  // }

  // registerOnTouched(fn: any): void {
  //   this.onTouched = fn;
  // }

  // setDisabledState?(isDisabled: boolean): void {
  //   // Handle disabled state
  // }
}
