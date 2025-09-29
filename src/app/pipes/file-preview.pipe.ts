import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filePreview'
})
export class FilePreviewPipe implements PipeTransform {
  transform(file: File): string {
    if (!file) return '';
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return reader.result as string; // This needs to be handled asynchronously in a real scenario
  }
}