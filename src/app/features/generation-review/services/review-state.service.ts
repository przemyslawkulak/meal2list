import { Injectable } from '@angular/core';
import { GenerationReviewItemDto } from '../../../../types';

export interface ReviewNavigationState {
  items: GenerationReviewItemDto[];
  listId: string;
  recipeText?: string;
  recipeName?: string;
  recipeSource?: string;
}

export interface NavigationParams {
  items: GenerationReviewItemDto[];
  listId: string;
  recipeText?: string;
  recipeName?: string;
  recipeSource?: string;
}

export interface RecipeNavigationData {
  recipeText: string;
  recipeName: string;
  recipeSource: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewStateService {
  loadNavigationState(): ReviewNavigationState | null {
    const state = window.history.state;

    if (!this.validateNavigationState(state)) {
      return null;
    }

    return {
      items: state.items,
      listId: state.listId,
      recipeText: state.recipeText || '',
      recipeName: state.recipeName || '',
      recipeSource: state.recipeSource || 'text',
    };
  }

  validateNavigationState(state: unknown): boolean {
    return !!(
      state &&
      typeof state === 'object' &&
      state !== null &&
      'items' in state &&
      'listId' in state
    );
  }

  createNavigationState(params: NavigationParams): RecipeNavigationData {
    return {
      recipeText: params.recipeText || '',
      recipeName: params.recipeName || '',
      recipeSource: params.recipeSource || 'text',
    };
  }
}
