import { describe, it, expect } from 'vitest';
import { rehypeResponsiveImages, type HastNode } from './rehypeResponsiveImages';

function makeImg(properties: Record<string, unknown> = {}): HastNode {
	return { type: 'element', tagName: 'img', properties };
}

function makeTree(children: HastNode[]): HastNode {
	return { type: 'root', children };
}

describe('rehypeResponsiveImages', () => {
	const transform = rehypeResponsiveImages();

	it('adds loading="lazy" to an img element', () => {
		const tree = makeTree([makeImg()]);
		transform(tree);
		expect(tree.children![0].properties!.loading).toBe('lazy');
	});

	it('adds decoding="async" to an img element', () => {
		const tree = makeTree([makeImg()]);
		transform(tree);
		expect(tree.children![0].properties!.decoding).toBe('async');
	});

	it('does not override existing loading attribute', () => {
		const tree = makeTree([makeImg({ loading: 'eager' })]);
		transform(tree);
		expect(tree.children![0].properties!.loading).toBe('eager');
	});

	it('does not override existing decoding attribute', () => {
		const tree = makeTree([makeImg({ decoding: 'sync' })]);
		transform(tree);
		expect(tree.children![0].properties!.decoding).toBe('sync');
	});

	it('does not modify non-img elements', () => {
		const node: HastNode = { type: 'element', tagName: 'p', properties: {} };
		const tree = makeTree([node]);
		transform(tree);
		expect(node.properties!.loading).toBeUndefined();
		expect(node.properties!.decoding).toBeUndefined();
	});

	it('does not modify text nodes', () => {
		const node: HastNode = { type: 'text' };
		const tree = makeTree([node]);
		transform(tree);
		expect(node.properties).toBeUndefined();
	});

	it('processes deeply nested img elements', () => {
		const img = makeImg();
		const tree: HastNode = {
			type: 'root',
			children: [{
				type: 'element',
				tagName: 'div',
				children: [{
					type: 'element',
					tagName: 'section',
					children: [img],
				}],
			}],
		};
		transform(tree);
		expect(img.properties!.loading).toBe('lazy');
		expect(img.properties!.decoding).toBe('async');
	});

	it('processes multiple img elements', () => {
		const img1 = makeImg();
		const img2 = makeImg();
		const tree = makeTree([img1, img2]);
		transform(tree);
		expect(img1.properties!.loading).toBe('lazy');
		expect(img2.properties!.loading).toBe('lazy');
	});

	it('handles an empty tree', () => {
		const tree: HastNode = { type: 'root' };
		// Should not throw
		expect(() => transform(tree)).not.toThrow();
	});

	it('handles img element without properties', () => {
		const img: HastNode = { type: 'element', tagName: 'img' };
		const tree = makeTree([img]);
		transform(tree);
		expect(img.properties!.loading).toBe('lazy');
		expect(img.properties!.decoding).toBe('async');
	});

	it('handles mixed element types in a tree', () => {
		const img = makeImg();
		const p: HastNode = { type: 'element', tagName: 'p', properties: {} };
		const span: HastNode = { type: 'element', tagName: 'span', properties: {} };
		const tree = makeTree([p, img, span]);
		transform(tree);
		expect(img.properties!.loading).toBe('lazy');
		expect(p.properties!.loading).toBeUndefined();
		expect(span.properties!.loading).toBeUndefined();
	});
});
