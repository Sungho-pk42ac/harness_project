import { downloadTextFile } from './download';

describe('downloadTextFile', () => {
  it('[정상] should object URL을 만들고 anchor를 클릭한 뒤 URL을 해제한다', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = click;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadTextFile('test.md', '# hi', 'text/markdown');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('test.md');
    expect(anchor.href).toContain('blob:fake');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    createElement.mockRestore();
    vi.unstubAllGlobals();
  });
});
