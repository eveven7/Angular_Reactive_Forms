import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { catchError, EMPTY, map, Observable, startWith, Subject, takeUntil, tap } from 'rxjs';
import { Post } from './interfaces/post';
import { PostsService } from './services/posts.service';
import { ValidationService } from './services/validation.service';



const fb = new FormBuilder();


const isNotEvelina: ValidatorFn = (control) => {
  return control.value === 'Evelina' ?
    { isNotEvelina: true } : null;
};

//every - every would be included 
const appropriateLanguage: ValidatorFn = (control) => {
  const swearWords = ['react', 'vue', 'java'];
  const value = control.value?.toLowerCase() || '';
  if (swearWords.some((word) => value.includes(word))) {
    return { appropriateLanguage: true };
  }
  return null;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public contentMaxLength = 50;
  public contentLengthRemaining$!: Observable<number>;
  postForm = fb.group({
    author: ['', [Validators.required, isNotEvelina]],
    title: [
      '',
      [Validators.required,
      Validators.minLength(5)],
      [this.validationService.uniqueTitle],
    ],
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(this.contentMaxLength),
        appropriateLanguage,
      ],
    ],
  },
    { updateOn: 'blur' },
  );

  ngOnInit(): void {
    this.contentLengthRemaining$ = this.postForm
      .get('content')!
      .valueChanges.pipe(
        startWith(''),
        takeUntil(this.destroy$),
        map((value) => {
          return this.contentMaxLength - (value?.length || 0);
        }),
      );
  }


  constructor(
    private postsService: PostsService,
    private validationService: ValidationService,) { }


  get title() {
    return this.postForm.get('title') as FormControl<string>;
  }
  get content() {
    return this.postForm.get('content') as FormControl<string>;
  }

  get author() {
    return this.postForm.get('author') as FormControl<string>;
  }



  ngOnDestroy(): void {
    this.destroy$.next();
  }

  onPostFormSubmit() {
    if (this.postForm.valid) {
      this.postsService
        .addPost(this.postForm.value as Post)
        .pipe(
          tap(() => {
            console.log('Post added: ', this.postForm.value);
            this.postForm.reset();
          }),
          catchError((error) => {
            console.log('Error adding post: ', error);
            return EMPTY;
          }),
        )
        .subscribe();
    }
  }
  onPostFormReset() {
    this.postForm.reset();
  }
}